import { CAMPUS_BUILDINGS } from "@/constants/map";
import { Colors } from "@/constants/theme";
import { ColorSchemeName, useColorScheme } from "@/hooks/use-color-scheme";
import { FieldType, SearchBuilding, TransportationMode } from "@/types/buildingTypes";
import { BuildingInfo, Coordinate, CoordinateDelta } from "@/types/mapTypes";
import { isPointInPolygon } from "@/utils/currentBuilding/pointInPolygon";
import { decodePolyline } from "@/utils/decodePolyline";
import { fetchAllDirections } from "@/utils/directions";
import * as LocationPermissions from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View, Pressable } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import MapView, { Circle, Marker, Polygon, Polyline, Region } from "react-native-maps";
import RoutesInfoPopup from "../navigation/routes-info-popup";
import BuildingInfoPopup from "./building-info-popup";
import BuildingSelection, { CURRENT_LOCATION_CODE } from "./building-selection";
import CampusToggle from "./campus-toggle";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";
import { E2EOverlay } from "./e2e-overlay";

interface PolylineSegment {
  coordinates: Coordinate[];
  color: string;
  isDashed: boolean;
}

interface TransitStopMarker {
  coordinate: Coordinate;
  name: string;
  color: string;
}

interface TransitionNode {
  coordinate: Coordinate;
  fromColor: string;
  toColor: string;
}

interface NavEndpointMarkerProps {
  readonly coordinate: Coordinate;
  readonly label: "A" | "B";
  readonly color: string;
}

function NavEndpointMarker({ coordinate, label, color }: NavEndpointMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={20}
      {...({ cluster: false } as any)}
    >
      <View style={styles.navPinWrapper}>
        <View style={[styles.navPinBubble, { backgroundColor: color }]}>
          <Text style={styles.navPinLabel}>{label}</Text>
        </View>
        <View style={[styles.navPinTail, { borderTopColor: color }]} />
      </View>
    </Marker>
  );
}

/**
 * Extracts departure and arrival stops from a transit step, returning them as markers with the given color.
 * @param step A step object from the directions API response, expected to contain transit_details if it's a transit step.
 * @param color The color to use for the stop markers, typically matching the transit line color.
 * @returns An array of TransitStopMarker objects for the departure and arrival stops, if available.
 */
function collectStopsFromStep(step: any, color: string): TransitStopMarker[] {
  const dep = step.transit_details?.departure_stop;
  const arr = step.transit_details?.arrival_stop;
  const stops: TransitStopMarker[] = [];

  if (dep?.location) {
    stops.push({
      coordinate: { latitude: dep.location.lat, longitude: dep.location.lng },
      name: dep.name ?? "",
      color,
    });
  }
  if (arr?.location) {
    stops.push({
      coordinate: { latitude: arr.location.lat, longitude: arr.location.lng },
      name: arr.name ?? "",
      color,
    });
  }
  return stops;
}

/**
 * Determines if a transition node is needed between the current step and the next step in the directions route, based on changes in travel mode or transit line color. If a transition is needed, it returns a TransitionNode object with the coordinate of the junction and the colors for the transition. If no transition is needed (i.e., the next step has the same mode and line color), it returns null.
 * @param coords The array of coordinates for the current step's polyline, used to find the junction point for the transition node.
 * @param color The color of the current step's polyline, used to compare against the next step's color to determine if a transition node is needed.
 * @param nextStep The next step in the directions route, used to determine the travel mode and transit line color for the next segment of the route.
 * @returns A TransitionNode object if a transition is needed, or null if the next step has the same mode and line color as the current step.
 */
function getTransitionNode(
  coords: Coordinate[],
  color: string,
  nextStep: any,
): TransitionNode | null {
  const nextMode = nextStep.travel_mode ?? "WALK";
  const nextVehicleType = nextStep.transit_details?.line?.vehicle_type;
  const nextColor = polylineColor(nextMode, nextVehicleType);

  if (nextColor === color) {
    return null;
  }
  const junction = coords.at(-1);
  return junction ? { coordinate: junction, fromColor: color, toColor: nextColor } : null;
}

/**
 * Determines the appropriate polyline color for a given travel mode and vehicle type, following Google Maps styling conventions. Transit modes are colored based on the type of transit (e.g., bus,
 * @param travelMode The travel mode for the step, such as
 * @param vehicleType The type of vehicle for transit steps, used to determine specific colors for different transit types (e.g., bus, subway, tram). This parameter is optional and only relevant when the travel mode is "TRANSIT".
 * @returns A string representing the hex color code to use for the polyline corresponding to the given travel mode and vehicle type. Transit modes have specific colors based on vehicle
 */
function polylineColor(travelMode: string, vehicleType?: string): string {
  const mode = travelMode?.toUpperCase();
  if (mode === "TRANSIT") {
    switch (vehicleType) {
      case "BUS":
        return "#049ede";
      case "TRAM":
      case "SUBWAY":
      case "RAIL":
      case "HEAVY_RAIL":
        return "#480efa";
      default:
        return "#1a73e8";
    }
  }
  return "#1a73e8";
}

interface Props {
    readonly userLocationDelta?: CoordinateDelta;
    readonly initialRegion?: Region;
    readonly isE2E?: boolean;
}

interface Cluster {
  id: string | number;
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    point_count: number;
  };
  onPress: () => void;
}

export default function MapViewer({
    userLocationDelta = defaultFocusDelta,
    initialRegion = defaultInitialRegion,
    isE2E = false,
}: Props) {
  const colorScheme = useColorScheme();
  const mapColors = Colors[colorScheme].map;
  const mapViewRef = useRef<MapView>(null);
  const suppressNextMapPress = useRef(false);

  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationButtonProps["state"]>("off");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(defaultInitialRegion);

  const [navigationMode, setNavigationMode] = useState<"browse" | "directions">("browse");
  const [shouldDisplayRoutes, setShouldDisplayRoutes] = useState(false);
  const [routes, setRoutes] = useState<Record<TransportationMode, any[] | null>>({
    walking: null,
    transit: null,
    driving: null,
    bicycling: null,
    shuttle: null,
  });
  const [routePolyline, setRoutePolyline] = useState<PolylineSegment[] | null>(null);
  const [routeStops, setRouteStops] = useState<TransitStopMarker[]>([]);
  const [routeNodes, setRouteNodes] = useState<TransitionNode[]>([]);
  const [routeKey, setRouteKey] = useState(0);
  const [navCoords, setNavCoords] = useState<{
    start: Coordinate | null;
    end: Coordinate | null;
  }>({
    start: null,
    end: null,
  });
  const [selectionOverrides, setSelectionOverrides] = useState<{
    start: string | null;
    end: string | null;
  }>({
    start: null,
    end: null,
  });
  const userClearedStart = useRef(false);
  const lastDestinationRef = useRef<{ coord: Coordinate | null; label: string }>({
    coord: null,
    label: "",
  });
  const lastStartRef = useRef<{ coord: Coordinate | null; label: string }>({
    coord: null,
    label: "",
  });
  const lastManualStartRef = useRef<{ coord: Coordinate | null; label: string }>({
    coord: null,
    label: "",
  });

  const showStartHint = navigationMode === "directions" && navCoords.end != null && navCoords.start == null;

  useEffect(() => {
    if (!navCoords.start || !navCoords.end) {
      return;
    }

    let cancelled = false;
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
    setShouldDisplayRoutes(true);

    (async () => {
      try {
        const nextRoutes = await fetchAllDirections(navCoords.start!, navCoords.end!);
        if (!cancelled) {
          setRoutes(nextRoutes);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch directions:", error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navCoords.start, navCoords.end]);

  const inBuildingCodes = useMemo(() => {
    const codes = new Set<string>();
    if (!userLocation) {
      return codes;
    }

    for (const building of CAMPUS_BUILDINGS) {
      for (const polygon of building.polygons) {
        if (isPointInPolygon(userLocation, polygon)) {
          codes.add(building.buildingCode);
          break;
        }
      }
    }

    return codes;
  }, [userLocation]);

  useEffect(() => {
    if (
      navigationMode === "directions" &&
      navCoords.start === null &&
      selectionOverrides.start === null &&
      !userClearedStart.current
    ) {
      let startCoord: Coordinate | null = null;
      let startLabel: string | null = null;

      // Priority 1: Check if there's a saved manual start location
      if (lastManualStartRef.current.coord && lastManualStartRef.current.label) {
        startCoord = lastManualStartRef.current.coord;
        startLabel = lastManualStartRef.current.label;
      }
      // Priority 2: User is inside a building
      else if (inBuildingCodes.size > 0) {
        const firstCode = [...inBuildingCodes][0];
        const startBuilding = CAMPUS_BUILDINGS.find(
          (building) => building.buildingCode === firstCode,
        );
        startLabel = startBuilding?.buildingName ?? firstCode;
        startCoord = startBuilding?.location ?? null;
      }
      // Priority 3: Use current location
      else if (userLocation) {
        startLabel = "Current Location";
        startCoord = userLocation;
      }

      if (startCoord && startLabel) {
        setNavCoords((prev) => ({ ...prev, start: startCoord }));
        setSelectionOverrides((prev) => ({ ...prev, start: startLabel }));
      }
    }
  }, [
    navigationMode,
    navCoords.start,
    selectionOverrides.start,
    inBuildingCodes,
    userLocation,
  ]);

  /**
   * Animates the map to center on the given building's location, using a tighter zoom level for better focus. The latitude and longitude deltas are adjusted to be no larger than 0.0025 to ensure a close-up view of the building, while still respecting the current zoom level if it's already close enough. This function is used when a building is selected to provide a focused view of that building on the map.
   * @param building The BuildingInfo object representing the building to focus on, which contains its location and other details.
   */
  const focusBuilding = useCallback(
    (building: BuildingInfo) => {
      mapViewRef.current?.animateToRegion({
        latitude: building.location.latitude,
        longitude: building.location.longitude,
        latitudeDelta: Math.min(currentRegion.latitudeDelta, 0.0025),
        longitudeDelta: Math.min(currentRegion.longitudeDelta, 0.0025),
      });
    },
    [currentRegion.latitudeDelta, currentRegion.longitudeDelta],
  );

  /**
   * Selects a building based on its building code, updating the selectedBuilding state. It searches the CAMPUS_BUILDINGS array for a building with the matching code and sets it as the selected building. If no building is found with the given code, it sets selectedBuilding to null. This function is used when a building is selected from the list or when navigating to a building, ensuring that the correct building information is displayed in the UI.
   * @param code The building code of the building to select, which is a unique identifier for each building on campus.
   */
  const selectBuildingByCode = useCallback((code: string) => {
    const nextBuilding =
      CAMPUS_BUILDINGS.find((building) => building.buildingCode === code) || null;
    setSelectedBuilding(nextBuilding);
    return nextBuilding;
  }, []);

  /**
   * Handles the event when a building is pressed on the map. It updates the selected building, focuses the map on that building, and resets any existing navigation state to switch back to browse mode. The function also sets a flag to suppress the next map press event, preventing unintended deselection of the building when the map is tapped immediately after selecting a building. This ensures a smooth user experience when interacting with buildings on the map.
   * @param building The BuildingInfo object representing the building that was pressed, which contains its details and location.
   */
  const handleBuildingPress = useCallback(
    (building: BuildingInfo) => {
      suppressNextMapPress.current = true;
      selectBuildingByCode(building.buildingCode);
      focusBuilding(building);
      setNavigationMode("browse");
      setShouldDisplayRoutes(false);
      setRoutePolyline(null);
      setRouteStops([]);
      setRouteNodes([]);
      setNavCoords({ start: null, end: null });
      setSelectionOverrides({ start: null, end: null });

      requestAnimationFrame(() => {
        suppressNextMapPress.current = false;
      });
    },
    [selectBuildingByCode, focusBuilding],
  );

  /**
   * Requests the user's current location, handling permissions and potential errors. If location services are disabled, it opens a modal to inform the user. If permissions are granted, it retrieves the current location and updates the userLocation state, as well as setting the location button state to "on". This function is called when the user presses the location button while location is currently off, allowing them to enable location tracking and center the map on their current position.
   */
  const requestLocation = useCallback(async () => {
    if (userLocation) {
      return;
    }

    const locationEnabled = await LocationPermissions.hasServicesEnabledAsync();
    if (!locationEnabled) {
      setModalOpen(true);
      return;
    }

    const { status } = await LocationPermissions.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const location = await LocationPermissions.getCurrentPositionAsync();
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    setLocationState("on");
  }, [userLocation]);

  /**
   * Animates the map to center on the user's current location, using the provided userLocationDelta for zoom level. This function is called when the user presses the location button while location tracking is on, allowing them to quickly re-center the map on their current position if they've panned away. It checks if the userLocation is available before attempting to animate the map, ensuring that it only tries to center when a valid location is present.
   */
  const centerLocation = useCallback(() => {
    if (!userLocation) {
      return;
    }

    mapViewRef.current?.animateToRegion({ ...userLocation, ...userLocationDelta });
    setLocationState("centered");
  }, [userLocation, userLocationDelta]);

  const [renderedPolygons, renderedMarkers] = useMemo(
    () =>
      renderBuildings(
        selectedBuilding?.buildingCode,
        inBuildingCodes,
        colorScheme,
        handleBuildingPress,
      ),
    [selectedBuilding?.buildingCode, inBuildingCodes, colorScheme, handleBuildingPress],
  );

  /**
   * Renders a cluster marker for a group of nearby points on the map. It displays the count of points in the cluster and styles the marker based on the current color scheme. When the cluster marker is pressed, it triggers the onPress function provided by the clustering library, which typically zooms in to reveal the individual points within the cluster. This function is used as a custom renderer for clusters in the MapViewCluster component, allowing for a consistent and visually appealing representation of clustered markers on the map.
   * @param cluster The Cluster object representing the cluster of points, which includes its geometry, properties (such as point count), and an onPress handler for when the cluster marker is tapped.
   * @returns A React element representing the cluster marker, styled according to the current color scheme and displaying the number of points in the cluster.
   */
  const renderCluster = useCallback(
    (cluster: Cluster) => {
      const { id, geometry, properties, onPress } = cluster;
      const count = properties.point_count ?? 0;

      return (
        <Marker
          key={`cluster-${id}`}
          coordinate={{
            latitude: geometry.coordinates[1],
            longitude: geometry.coordinates[0],
          }}
          onPress={onPress}
        >
          <View
            style={[
              styles.clusterMarker,
              {
                backgroundColor: mapColors.clusterMarker,
                borderColor: mapColors.markerBorder,
              },
            ]}
          >
            <Text style={[styles.clusterText, { color: mapColors.clusterText }]}>
              {count > 9 ? "9+" : count}
            </Text>
          </View>
        </Marker>
      );
    },
    [mapColors],
  );

  /**
   * Handles the navigation action when the user chooses to navigate to a selected building. It determines the starting point for navigation based on the user's current location, any buildings they are currently in, or a manually selected start point. It then sets the navigation coordinates and mode to "directions", which triggers the fetching and display of routes from the start location to the selected building. This function is called when the user presses the navigate button in the BuildingInfoPopup, allowing them to easily get directions to the building they are interested in.
   */
  const navigateToBuilding = useCallback(() => {
    if (!selectedBuilding) {
      return;
    }

    const mapBuilding = CAMPUS_BUILDINGS.find(
      (building) => building.buildingCode === selectedBuilding.buildingCode,
    );
    if (!mapBuilding) {
      return;
    }

    let startCoord: Coordinate | null = null;
    let startLabel: string | null = null;

    // Priority 1: Check if there's a saved manual start location
    if (lastManualStartRef.current.coord && lastManualStartRef.current.label) {
      startCoord = lastManualStartRef.current.coord;
      startLabel = lastManualStartRef.current.label;
    }
    // Priority 2: User is inside a building
    else if (inBuildingCodes.size > 0) {
      const firstCode = [...inBuildingCodes][0];
      const startBuilding = CAMPUS_BUILDINGS.find(
        (building) => building.buildingCode === firstCode,
      );
      startLabel = startBuilding?.buildingName ?? firstCode;
      startCoord = startBuilding?.location ?? userLocation ?? null;
    }
    // Priority 3: Use current location
    else if (userLocation) {
      startLabel = "Current Location";
      startCoord = userLocation;
    }
    // Priority 4: Use last start ref if it exists
    else if (lastStartRef.current.coord && lastStartRef.current.label) {
      startLabel = lastStartRef.current.label;
      startCoord = lastStartRef.current.coord;
    }

    if (startCoord && startLabel) {
      lastStartRef.current = { coord: startCoord, label: startLabel };
    }

    setSelectionOverrides({
      start: startLabel,
      end: selectedBuilding.buildingName,
    });

    lastDestinationRef.current = {
      coord: mapBuilding.location,
      label: selectedBuilding.buildingName,
    };
    userClearedStart.current = false;
    setNavCoords({ start: startCoord, end: mapBuilding.location });
    setNavigationMode("directions");
    setShouldDisplayRoutes(true);
  }, [selectedBuilding, inBuildingCodes, userLocation]);

  const setBuildingAsStart = useCallback(() => {
    if (!selectedBuilding) {
      return;
    }

    const mapBuilding = CAMPUS_BUILDINGS.find(
      (building) => building.buildingCode === selectedBuilding.buildingCode,
    );
    if (!mapBuilding) {
      return;
    }

    const lastDest = lastDestinationRef.current;
    lastStartRef.current = {
      coord: mapBuilding.location,
      label: selectedBuilding.buildingName,
    };
    lastManualStartRef.current = {
      coord: mapBuilding.location,
      label: selectedBuilding.buildingName,
    };
    userClearedStart.current = false;
    setNavigationMode("directions");
    setShouldDisplayRoutes(lastDest.coord != null);
    setSelectionOverrides({ start: selectedBuilding.buildingName, end: lastDest.label });
    setNavCoords({ start: mapBuilding.location, end: lastDest.coord });
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
  }, [selectedBuilding]);

  /**
   * Handles the action of going back from the directions view to the browse mode. It resets all navigation-related state, including the navigation mode, route display, navigation coordinates, selection overrides, and any displayed routes or stops. This function is called when the user presses the back button in the RoutesInfoPopup, allowing them to exit the directions view and return to browsing the map without any active navigation routes displayed.
   */
  const handleBackFromDirections = useCallback(() => {
    userClearedStart.current = false;
    setNavigationMode("browse");
    setShouldDisplayRoutes(false);
    setNavCoords({ start: null, end: null });
    setSelectionOverrides({ start: null, end: null });
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
  }, []);

  /**
   * Handles the action of swapping the start and end fields in the navigation directions. It updates the navigation coordinates, selection overrides, and manual start point to reflect the swap. This allows users to quickly reverse their route without having to manually re-enter the start and end locations. The function also resets any displayed routes or stops, prompting a new route calculation based on the updated coordinates. This is typically called when the user presses a swap button in the BuildingSelection component while in directions mode.
   */
  const handleSwapFields = useCallback(() => {
    // Capture current values before swapping
    const currentStart = navCoords.start;
    const currentEnd = navCoords.end;

    // Swap the coordinates
    setNavCoords({ start: currentEnd, end: currentStart });
    setSelectionOverrides((prev) => ({ start: prev.end, end: prev.start }));
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
  }, [navCoords.start, navCoords.end]);

  const clearRouteRendering = useCallback(() => {
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
  }, []);

  const resolveSelectionCoordinate = useCallback(
    (selectedCode?: string) => {
      if (selectedCode === CURRENT_LOCATION_CODE) {
        return userLocation;
      }
      if (!selectedCode) {
        return null;
      }

      const building = CAMPUS_BUILDINGS.find((b) => b.buildingCode === selectedCode);
      return building?.location ?? null;
    },
    [userLocation],
  );

  const handleStartSelection = useCallback((coord: Coordinate | null, label: string) => {
    userClearedStart.current = !coord;
    if (coord) {
      lastStartRef.current = { coord, label };
      lastManualStartRef.current = { coord, label };
    }
  }, []);

  const handleEndSelection = useCallback(
    (selected: SearchBuilding | null, coord: Coordinate | null) => {
      if (coord) {
        lastDestinationRef.current = { coord, label: selected?.buildingName ?? "" };
      }

      if (selected?.buildingCode && selected.buildingCode !== CURRENT_LOCATION_CODE) {
        const nextBuilding = selectBuildingByCode(selected.buildingCode);
        if (nextBuilding) {
          focusBuilding(nextBuilding);
        }
      } else {
        setSelectedBuilding(null);
      }
    },
    [focusBuilding, selectBuildingByCode],
  );

  return (
    <View style={styles.container}>
      <BuildingSelection
        mode={navigationMode}
        selectedBuilding={selectedBuilding}
        currentBuildingCodes={inBuildingCodes}
        hasUserLocation={!!userLocation && inBuildingCodes.size === 0}
        startOverride={selectionOverrides.start}
        endOverride={selectionOverrides.end}
        startHint={showStartHint ? "Please select a start location" : null}
        onSwap={handleSwapFields}
        onSelect={(
          buildings: Record<FieldType, SearchBuilding | null>,
          type: FieldType,
        ) => {
          const selected = buildings[type];
          const selectedCode = selected?.buildingCode;
          const coord = resolveSelectionCoordinate(selectedCode);

          setNavCoords((prev) => ({ ...prev, [type]: coord }));
          setSelectionOverrides((prev) => ({
            ...prev,
            [type]: selected?.buildingName ?? null,
          }));

          if (type === "start") {
            handleStartSelection(coord, selected?.buildingName ?? "");
          }

          if (!coord) {
            clearRouteRendering();
          }

          if (type === "end") {
            handleEndSelection(selected, coord);
          }
        }}
      />

      <CampusToggle mapRef={mapViewRef} viewRegion={currentRegion} />

      <MapViewCluster
        ref={mapViewRef}
        testID="map-view"
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={!!userLocation}
        followsUserLocation={locationState === "centered"}
        clusteringEnabled={Platform.OS !== "ios"}
        onRegionChangeComplete={(region) => {
          setCurrentRegion(region);

          const latDiff = Math.abs(region.latitude - (userLocation?.latitude ?? 0));
          const lonDiff = Math.abs(region.longitude - (userLocation?.longitude ?? 0));

          if (userLocation && latDiff < 0.0001 && lonDiff < 0.0001) {
            setLocationState("centered");
          } else if (userLocation) {
            setLocationState("on");
          }
        }}
        onPanDrag={() => {
          if (userLocation) {
            setLocationState("on");
          }
        }}
        onUserLocationChange={({ nativeEvent }) => {
          const coordinate = nativeEvent?.coordinate;
          if (!coordinate) {
            return;
          }

          if (!userLocation) {
            setLocationState("on");
          }

          setUserLocation({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
          });
        }}
        spiralEnabled={false}
        onPress={(event) => {
          if (suppressNextMapPress.current) {
            return;
          }

          const action = event?.nativeEvent?.action;
          if (!action || action === "press") {
            setSelectedBuilding(null);
            setNavigationMode("browse");
            setShouldDisplayRoutes(false);
            setRoutePolyline(null);
            setRouteStops([]);
            setRouteNodes([]);
            setNavCoords({ start: null, end: null });
            setSelectionOverrides({ start: null, end: null });
          }
        }}
        renderCluster={renderCluster}
      >
        {renderedPolygons}
        {renderedMarkers}

        {routePolyline?.map((segment, index) => {
          const dashedWidth = Platform.OS === "android" ? 6 : 3;
          const strokeWidth = segment.isDashed ? dashedWidth : 3;
          const firstCoord = segment.coordinates[0];
          const lastCoord = segment.coordinates.at(-1);

          return (
            <Polyline
              key={`polyline-seg-${routeKey}-${index}-${segment.color}-${segment.isDashed}-${firstCoord?.latitude}-${firstCoord?.longitude}-${lastCoord?.latitude}-${lastCoord?.longitude}`}
              coordinates={segment.coordinates}
              strokeColor={segment.color}
              strokeWidth={strokeWidth}
              {...(segment.isDashed
                ? { lineDashPattern: Platform.OS === "android" ? [8, 16] : [1, 8] }
                : {})}
              zIndex={10}
            />
          );
        })}

        {routeStops.map((stop, index) =>
          Platform.OS === "android" ? (
            <Circle
              key={`stop-${routeKey}-${index}-${stop.coordinate.latitude}-${stop.coordinate.longitude}`}
              center={stop.coordinate}
              radius={5}
              fillColor="#fff"
              strokeColor={stop.color}
              strokeWidth={2}
              zIndex={11}
            />
          ) : (
            <Marker
              key={`stop-${routeKey}-${index}-${stop.coordinate.latitude}-${stop.coordinate.longitude}`}
              coordinate={stop.coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={11}
            >
              <View
                collapsable={false}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: "#fff",
                  borderWidth: 2,
                  borderColor: stop.color,
                }}
              />
            </Marker>
          ),
        )}

        {Platform.OS === "android"
          ? routeNodes.map((node, index) => (
              <Circle
                key={`node-${routeKey}-${index}-${node.coordinate.latitude}-${node.coordinate.longitude}`}
                center={node.coordinate}
                radius={7}
                fillColor={node.toColor}
                strokeColor="#fff"
                strokeWidth={3}
                zIndex={12}
              />
            ))
          : routeNodes.map((node, index) => (
              <Marker
                key={`node-${routeKey}-${index}-${node.coordinate.latitude}-${node.coordinate.longitude}`}
                coordinate={node.coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={12}
              >
                <View
                  collapsable={false}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: node.toColor,
                    borderWidth: 3,
                    borderColor: "#fff",
                  }}
                />
              </Marker>
            ))}
        {navigationMode === "directions" && navCoords.start && (
          <NavEndpointMarker
            key={`nav-start-${navCoords.start.latitude}-${navCoords.start.longitude}`}
            coordinate={navCoords.start}
            label="A"
            color="#049ede"
          />
        )}
        {navigationMode === "directions" && navCoords.end && (
          <NavEndpointMarker
            key={`nav-end-${navCoords.end.latitude}-${navCoords.end.longitude}`}
            coordinate={navCoords.end}
            label="B"
            color="#049ede"
          />
        )}
      </MapViewCluster>

      {isE2E && <E2EOverlay 
      inBuildingCodes={inBuildingCodes}
      selectBuildingByCode={selectBuildingByCode}
      focusBuilding={focusBuilding}
      currentRegion={currentRegion}
      mapViewRef={mapViewRef}
      />}
      <LocationButton
        state={locationState}
        onPress={() => {
          if (locationState === "on") {
            centerLocation();
          } else if (locationState === "off") {
            requestLocation();
          }
        }}
      />

      <LocationModal visible={modalOpen} onRequestClose={() => setModalOpen(false)} />

      {navigationMode === "browse" && selectedBuilding && (
        <BuildingInfoPopup
          building={selectedBuilding}
          onNavigate={navigateToBuilding}
          onSetAsStart={setBuildingAsStart}
        />
      )}

      {navigationMode === "directions" && (
        <RoutesInfoPopup
          routes={routes}
          isOpen={shouldDisplayRoutes}
          onBack={handleBackFromDirections}
          onRouteSelect={(route: any) => {
            // Build new route data synchronously before touching state
            const segments: PolylineSegment[] = [];
            const stops: TransitStopMarker[] = [];
            const nodes: TransitionNode[] = [];
            const allSteps = (route?.legs ?? []).flatMap((leg: any) => leg?.steps ?? []);

            for (let index = 0; index < allSteps.length; index++) {
              const step = allSteps[index];
              const encoded = step?.polyline?.points;
              if (!encoded) {
                continue;
              }

              const coords = decodePolyline(encoded);
              if (coords.length < 2) {
                continue;
              }

              const mode = step.travel_mode ?? "WALK";
              const vehicleType = step.transit_details?.line?.vehicle_type;
              const color = polylineColor(mode, vehicleType);
              const isWalking =
                mode.toUpperCase() === "WALK" || mode.toUpperCase() === "WALKING";

              segments.push({ coordinates: coords, color, isDashed: isWalking });
              stops.push(...collectStopsFromStep(step, color));

              const nextStep = allSteps[index + 1];
              if (nextStep) {
                const node = getTransitionNode(coords, color, nextStep);
                if (node) nodes.push(node);
              }
            }

            // clear all existing polylines so native views are removed
            setRouteKey((k) => k + 1);
            setRoutePolyline(null);
            setRouteStops([]);
            setRouteNodes([]);

            // then set new data on the next frame to ensure a clean transition without lingering old polylines
            requestAnimationFrame(() => {
              setRoutePolyline(segments.length > 0 ? segments : null);
              setRouteStops(stops);
              setRouteNodes(nodes);
            });
          }}
          onStepSelect={(encoded: string) => {
            const coords = decodePolyline(encoded);
            if (coords.length >= 2) {
              const mid = coords[Math.floor(coords.length / 2)];
              mapViewRef.current?.animateToRegion({
                latitude: mid.latitude,
                longitude: mid.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              });
            }
          }}
        />
      )}
    </View>
  );
}

/**
 * Renders the building polygons and markers on the map, applying different colors and z-indexes based on whether the building is selected or if the user is currently inside the building. It iterates through the CAMPUS_BUILDINGS array and creates Polygon components for each building's polygons, as well as Marker components for each building's location. The colors and z-indexes are determined by the getPolygonColor and getPolygonZIndex helper functions, which take into account the selection state and whether the user is inside the building. The onPress handler for both polygons and markers calls the provided onPress function with the building information when tapped.
 * @param selectedBuildingCode The building code of the currently selected building, used to determine if a building should be rendered as selected.
 * @param inBuildingCodes A set of building codes that the user is currently inside, used to determine if a building should be rendered with the "in building" color.
 * @param colorScheme The current color scheme (light or dark) used to apply the appropriate colors for polygons and markers based on the theme.
 * @param onPress A callback function that is called when a building polygon or marker is pressed, receiving the BuildingInfo object of the pressed building as an argument. This allows the parent component to handle building selection and other interactions when a building is tapped on the map.
 * @returns
 */
function renderBuildings(
  selectedBuildingCode: string | undefined,
  inBuildingCodes: Set<string>,
  colorScheme: ColorSchemeName,
  onPress: (building: BuildingInfo) => void,
): [React.JSX.Element[], React.JSX.Element[]] {
  const mapColors = Colors[colorScheme].map;

  const renderedPolygons: React.JSX.Element[] = [];
  const renderedMarkers: React.JSX.Element[] = [];

  CAMPUS_BUILDINGS.forEach((building, buildingIndex) => {
    const isSelected = selectedBuildingCode === building.buildingCode;
    const isInBuilding = inBuildingCodes.has(building.buildingCode);
    const polygonColor = getPolygonColor(isSelected, isInBuilding, colorScheme);
    const zIndex = getPolygonZIndex(isSelected, isInBuilding);

    building.polygons.forEach((polygonData, polygonIndex) => {
      renderedPolygons.push(
        <Polygon
          key={`${buildingIndex}-${polygonIndex}-${isInBuilding}`}
          testID="polygon"
          coordinates={polygonData}
          tappable
          fillColor={polygonColor}
          zIndex={zIndex}
          strokeColor={mapColors.polygonStroke}
          strokeWidth={2}
          onPress={() => onPress(building)}
        />,
      );
    });

    renderedMarkers.push(
      <Marker
        testID={`marker-${building.buildingCode}`}
        key={building.buildingCode}
        coordinate={building.location}
        onPress={() => onPress(building)}
      >
        <View
          style={[
            styles.marker,
            {
              backgroundColor: isSelected ? mapColors.markerSelected : mapColors.marker,
              borderColor: isSelected
                ? mapColors.markerBorderSelected
                : mapColors.markerBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.markerText,
              { color: isSelected ? mapColors.markerTextSelected : mapColors.markerText },
            ]}
          >
            {building.buildingCode}
          </Text>
        </View>
      </Marker>,
    );
  });

  return [renderedPolygons, renderedMarkers];
}

function getPolygonZIndex(isSelected: boolean, isInBuilding: boolean) {
  if (isSelected) {
    return 2;
  }
  if (isInBuilding) {
    return 1;
  }
  return 0;
}

function getPolygonColor(
  isSelected: boolean,
  isInBuilding: boolean,
  colorScheme: ColorSchemeName,
) {
  const mapColors = Colors[colorScheme].map;

  if (isSelected && isInBuilding) {
    return mapColors.currentSelectedBuildingColor;
  }
  if (isSelected) {
    return mapColors.polygonHighlighted;
  }
  if (isInBuilding) {
    return mapColors.currentBuildingColor;
  }
  return mapColors.polygonFill;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", flex: 1 },
  marker: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
  },
  markerText: {
    fontWeight: "700",
    fontSize: 12,
  },
  clusterMarker: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 2,
  },
  clusterText: {
    fontWeight: "800",
    fontSize: 12,
  },
  navPinWrapper: {
    alignItems: "center" as const,
  },
  navPinBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
    borderColor: "#fff",
  },
  navPinLabel: {
    color: "#fff",
    fontWeight: "800" as const,
    fontSize: 13,
  },
  navPinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});

const defaultFocusDelta: CoordinateDelta = {
  latitudeDelta: 0.00922,
  longitudeDelta: 0.00421,
};

const defaultInitialRegion: Region = {
  latitude: 45.49575,
  longitude: -73.5793055556,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0922,
};
