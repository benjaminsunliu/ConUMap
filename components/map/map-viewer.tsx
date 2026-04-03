import { CAMPUS_BUILDINGS } from "@/constants/map";
import { Colors } from "@/constants/theme";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { OutdoorRouteStep, OutdoorStepResume } from "@/globals/OutdoorStepResumeStore";
import { ColorSchemeName, useColorScheme } from "@/hooks/use-color-scheme";
import { FieldType, SearchBuilding, TransportationMode } from "@/types/buildingTypes";
import { BuildingInfo, Campus, Coordinate, CoordinateDelta, POI } from "@/types/mapTypes";
import { isPointInPolygon } from "@/utils/currentBuilding/pointInPolygon";
import { decodePolyline } from "@/utils/decodePolyline";
import { fetchAllDirections } from "@/utils/directions";
import {
  decodeIndoorStepPayload,
  enrichRoutesWithIndoorTransitions,
  resolveSearchSelectionBuildingCode,
} from "@/utils/hybridNavigation";
import * as LocationPermissions from "expo-location";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import MapView, {
  Circle,
  MapStyleElement,
  Marker,
  Polygon,
  Polyline,
  Region,
} from "react-native-maps";
import RoutesInfoPopup, {
  RouteStepSelectionContext,
} from "../navigation/routes-info-popup";
import BuildingInfoPopup from "./building-info-popup";
import BuildingSelection from "./building-selection";
import CampusToggle from "./campus-toggle";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";
import OutdoorMapSettings from "./outdoor-map-settings";
import { CURRENT_LOCATION_CODE } from "@/hooks/use-search-building";
import PoiMarker from "./poi-marker";
import { usePoi } from "@/hooks/use-poi";
import { POIInfoPopup } from "./poi-info-popup";

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

interface RouteOverlayState {
  polyline: PolylineSegment[] | null;
  stops: TransitStopMarker[];
  nodes: TransitionNode[];
}

interface NavEndpointMarkerProps {
  readonly coordinate: Coordinate;
  readonly label: "A" | "B";
  readonly color: string;
}

type PoiTypeFilters = {
  restaurant: boolean;
  cafe: boolean;
  library: boolean;
  gym: boolean;
  park: boolean;
  shopping_mall: boolean;
  supermarket: boolean;
};

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

function normalizeStepTravelMode(travelMode: string | undefined): string {
  const mode = (travelMode ?? "WALK").toUpperCase();

  if (mode === "WALKING") {
    return "WALK";
  }
  if (mode === "DRIVE") {
    return "DRIVING";
  }
  if (mode === "BICYCLE") {
    return "BICYCLING";
  }

  return mode;
}

function areCoordinatesEqual(a: Coordinate, b: Coordinate) {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

function coalesceRouteSegments(segments: PolylineSegment[]) {
  if (segments.length <= 1) {
    return segments;
  }

  const merged: PolylineSegment[] = [];

  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (!previous) {
      merged.push({
        coordinates: [...segment.coordinates],
        color: segment.color,
        isDashed: segment.isDashed,
      });
      continue;
    }

    const canMerge =
      previous.color === segment.color && previous.isDashed === segment.isDashed;
    if (!canMerge) {
      merged.push({
        coordinates: [...segment.coordinates],
        color: segment.color,
        isDashed: segment.isDashed,
      });
      continue;
    }

    const previousLast = previous.coordinates[previous.coordinates.length - 1];
    const segmentFirst = segment.coordinates[0];
    if (!previousLast || !segmentFirst) {
      merged.push({
        coordinates: [...segment.coordinates],
        color: segment.color,
        isDashed: segment.isDashed,
      });
      continue;
    }

    const nextCoordinates = areCoordinatesEqual(previousLast, segmentFirst)
      ? segment.coordinates.slice(1)
      : segment.coordinates;
    previous.coordinates.push(...nextCoordinates);
  }

  return merged;
}

function buildOutdoorStepResume(step: any): OutdoorRouteStep | null {
  const encodedPolyline = step?.polyline?.points;
  const travelMode = normalizeStepTravelMode(step?.travel_mode);
  if (!encodedPolyline || travelMode === "INDOOR") {
    return null;
  }

  return {
    encodedPolyline,
    travelMode,
  };
}

interface Props {
  readonly userLocationDelta?: CoordinateDelta;
  readonly initialRegion?: Region;
}

const EMPTY_ROUTES: Record<TransportationMode, any[] | null> = {
  walking: null,
  transit: null,
  driving: null,
  bicycling: null,
  shuttle: null,
};

const EMPTY_ROUTE_OVERLAY: RouteOverlayState = {
  polyline: null,
  stops: [],
  nodes: [],
};

function normalizeRoutes(
  routes: Partial<Record<TransportationMode, any[] | null>> | null | undefined,
): Record<TransportationMode, any[] | null> {
  return {
    walking: Array.isArray(routes?.walking) ? routes.walking : null,
    transit: Array.isArray(routes?.transit) ? routes.transit : null,
    driving: Array.isArray(routes?.driving) ? routes.driving : null,
    bicycling: Array.isArray(routes?.bicycling) ? routes.bicycling : null,
    shuttle: Array.isArray(routes?.shuttle) ? routes.shuttle : null,
  };
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
}: Props) {
  const colorScheme = useColorScheme();
  const mapColors = Colors[colorScheme].map;
  const mapViewRef = useRef<MapView>(null);
  const suppressNextMapPress = useRef(false);

  const [currCampus, setCurrCampus] = useState<Campus>("SGW");
  const [radius, setRadius] = useState(0);
  const [searchFieldFocused, setSearchFieldFocused] = useState(false);

  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationButtonProps["state"]>("off");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(defaultInitialRegion);

  const [navigationMode, setNavigationMode] = useState<"browse" | "directions">("browse");
  const [shouldDisplayRoutes, setShouldDisplayRoutes] = useState(false);

  const [routes, setRoutes] = useState<Record<TransportationMode, any[] | null>>(
    normalizeRoutes(EMPTY_ROUTES),
  );
  const [routeOverlay, setRouteOverlay] = useState<RouteOverlayState>(
    EMPTY_ROUTE_OVERLAY,
  );
  const [routeKey, setRouteKey] = useState(0);
  const pendingRouteRenderFrameRef = useRef<number | null>(null);
  const routeRenderGenerationRef = useRef(0);
  const activeIndoorStepSessionRef = useRef<{
    resumeContinuationId: string | null;
  } | null>(null);
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
  const [selectedSearchLocations, setSelectedSearchLocations] = useState<
    Record<FieldType, SearchBuilding | null>
  >({
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
  const lastManualStartSelectionRef = useRef<SearchBuilding | null>(null);

  const showStartHint =
    navigationMode === "directions" && navCoords.end != null && navCoords.start == null;
  const isTestEnvironment = process.env.NODE_ENV === "test";
  const shouldRenderDirectionAuxOverlays = !(
    Platform.OS === "ios" && navigationMode === "directions" && !isTestEnvironment
  );

  const { buildingId, autoNavigate } = useLocalSearchParams<{
    buildingId?: string;
    buildingName?: string;
    autoNavigate?: string;
  }>();
  const places = usePoi(currCampus, radius);
  const [poiFilters, setPoiFilters] = useState<PoiTypeFilters>({
    restaurant: true,
    cafe: true,
    library: true,
    gym: true,
    park: true,
    shopping_mall: true,
    supermarket: true,
  });
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);

  const cancelPendingRouteRender = useCallback(() => {
    routeRenderGenerationRef.current += 1;
    if (
      pendingRouteRenderFrameRef.current != null &&
      typeof cancelAnimationFrame === "function"
    ) {
      cancelAnimationFrame(pendingRouteRenderFrameRef.current);
    }
    pendingRouteRenderFrameRef.current = null;
  }, []);

  const clearRouteRendering = useCallback(() => {
    cancelPendingRouteRender();
    // Force route overlays to remount so stale native polylines do not linger.
    setRouteKey((key) => key + 1);
    setRouteOverlay(EMPTY_ROUTE_OVERLAY);
  }, [cancelPendingRouteRender]);

  useEffect(() => {
    return () => {
      cancelPendingRouteRender();
    };
  }, [cancelPendingRouteRender]);

  const focusRouteStep = useCallback((encoded: string) => {
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
  }, []);

  /**
   * Clears all navigation-related state, resetting the map to browse mode. It hides any displayed routes, clears the route polyline, stops, and transition nodes, and resets the navigation coordinates and selection overrides.
   */
  const clearRouteInfo = useCallback(() => {
    activeIndoorStepSessionRef.current = null;
    lastDestinationRef.current = { coord: null, label: "" };
    setNavigationMode("browse");

    setShouldDisplayRoutes(false);
    setRoutes(normalizeRoutes(EMPTY_ROUTES));
    clearRouteRendering();
    setNavCoords({ start: null, end: null });
    setSelectionOverrides({ start: null, end: null });
    setSelectedSearchLocations({ start: null, end: null });

    requestAnimationFrame(() => {
      suppressNextMapPress.current = false;
    });
  }, [clearRouteRendering]);

  useFocusEffect(
    useCallback(() => {
      const pendingStep = OutdoorStepResume.consumePendingStep();
      if (!pendingStep) {
        const activeIndoorStepSession = activeIndoorStepSessionRef.current;
        if (!activeIndoorStepSession) {
          return;
        }

        if (activeIndoorStepSession.resumeContinuationId) {
          OutdoorStepResume.clearContinuation(
            activeIndoorStepSession.resumeContinuationId,
          );
        }
        clearRouteInfo();
        return;
      }

      activeIndoorStepSessionRef.current = null;
      focusRouteStep(pendingStep.encodedPolyline);
    }, [clearRouteInfo, focusRouteStep]),
  );

  useEffect(() => {
    const routeStart = navCoords.start;
    const routeEnd = navCoords.end;
    if (!routeStart || !routeEnd) {
      return;
    }

    let cancelled = false;
    clearRouteRendering();
    setShouldDisplayRoutes(true);

    const startSelection = selectedSearchLocations.start;
    const endSelection = selectedSearchLocations.end;

    (async () => {
      try {
        const fetchedRoutes = normalizeRoutes(
          await fetchAllDirections(routeStart, routeEnd),
        );
        const nextRoutes = await enrichRoutesWithIndoorTransitions(
          fetchedRoutes,
          {
            start: startSelection,
            end: endSelection,
          },
          CAMPUS_BUILDINGS,
        );
        if (!cancelled) {
          setRoutes(normalizeRoutes(nextRoutes));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch directions:", error);
          setRoutes(normalizeRoutes(EMPTY_ROUTES));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    navCoords.start,
    navCoords.end,
    selectedSearchLocations.start,
    selectedSearchLocations.end,
    clearRouteRendering,
  ]);

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

  const resolveStartLocation = useCallback(() => {
    // Priority 1: Check if there's a saved manual start location
    if (lastManualStartRef.current.coord && lastManualStartRef.current.label) {
      return {
        coord: lastManualStartRef.current.coord,
        label: lastManualStartRef.current.label,
      };
    }

    // Priority 2: User is inside a building
    if (inBuildingCodes.size > 0) {
      const firstCode = [...inBuildingCodes][0];
      const startBuilding = CAMPUS_BUILDINGS.find(
        (building) => building.buildingCode === firstCode,
      );

      return {
        coord: startBuilding?.location ?? userLocation ?? null,
        label: startBuilding?.buildingName ?? firstCode,
      };
    }

    // Priority 3: Use current location
    if (userLocation) {
      return { coord: userLocation, label: "Current Location" };
    }

    // Priority 4: Use last start ref if it exists
    if (lastStartRef.current.coord && lastStartRef.current.label) {
      return {
        coord: lastStartRef.current.coord,
        label: lastStartRef.current.label,
      };
    }

    return { coord: null, label: null };
  }, [inBuildingCodes, userLocation]);

  useEffect(() => {
    if (
      navigationMode === "directions" &&
      navCoords.start === null &&
      selectionOverrides.start === null &&
      !userClearedStart.current
    ) {
      const { coord: startCoord, label: startLabel } = resolveStartLocation();

      if (startCoord && startLabel) {
        setNavCoords((prev) => ({ ...prev, start: startCoord }));
        setSelectionOverrides((prev) => ({ ...prev, start: startLabel }));
      }
    }
  }, [navigationMode, navCoords.start, selectionOverrides.start, resolveStartLocation]);

  /**
   * Animates the map to center on the given building's location, using a tighter zoom level for better focus. The latitude and longitude deltas are adjusted to be no larger than 0.0025 to ensure a close-up view of the building, while still respecting the current zoom level if it's already close enough. This function is used when a building is selected to provide a focused view of that building on the map.
   * @param lat The latitude of the building's location to focus on.
   * @param lng The longitude of the building's location to focus on.
   */
  const focusBuilding = useCallback(
    (lat: number, lng: number) => {
      mapViewRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
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
   * Handles "View in Map" button from class-block.tsx and class-detail-popup.tsx. When a buildingId is present in the search parameters, it attempts to find the corresponding building and focus the map on it. After handling the building selection and map focus, it replaces the current route with "/map" to clear the buildingId from the URL, preventing repeated navigation to the same building.
   *
   */
  useEffect(() => {
    if (!buildingId) return;
    const nextBuilding = selectBuildingByCode(buildingId);
    if (nextBuilding) {
      focusBuilding(nextBuilding.location.latitude, nextBuilding.location.longitude);

      if (autoNavigate === "true") {
        const { coord: startCoord, label: startLabel } = resolveStartLocation();

        if (startCoord && startLabel) {
          lastStartRef.current = { coord: startCoord, label: startLabel };
        }

        setSelectionOverrides({
          start: startLabel,
          end: nextBuilding.buildingName,
        });
        lastDestinationRef.current = {
          coord: nextBuilding.location,
          label: nextBuilding.buildingName,
        };
        userClearedStart.current = false;
        setSelectedSearchLocations({ start: null, end: null });
        setNavCoords({ start: startCoord, end: nextBuilding.location });
        setNavigationMode("directions");
        setShouldDisplayRoutes(true);
      }
    }
    // Ensures that buildingId is undefined after
    router.setParams({ buildingId: "", buildingName: "", autoNavigate: "" });
  }, [
    buildingId,
    autoNavigate,
    selectBuildingByCode,
    focusBuilding,
    resolveStartLocation,
  ]);

  /**
   * Handles the event when a building is pressed on the map. It updates the selected building, focuses the map on that building, and resets any existing navigation state to switch back to browse mode. The function also sets a flag to suppress the next map press event, preventing unintended deselection of the building when the map is tapped immediately after selecting a building. This ensures a smooth user experience when interacting with buildings on the map.
   * @param building The BuildingInfo object representing the building that was pressed, which contains its details and location.
   */
  const handleBuildingPress = useCallback(
    (building: BuildingInfo) => {
      setSelectedPOI(null);
      suppressNextMapPress.current = true;
      selectBuildingByCode(building.buildingCode);
      focusBuilding(building.location.latitude, building.location.longitude);
      clearRouteInfo();
    },
    [selectBuildingByCode, focusBuilding, clearRouteInfo],
  );

  /**
   * Handles the event when a POI is pressed on the map. It updates the selected POI state, focuses the map on the POI's location, and resets any existing navigation state to switch back to browse mode.
   * @param poi The POI object representing the point of interest that was pressed
   */
  const handlePOIPress = useCallback(
    (poi: POI) => {
      setSelectedBuilding(null);
      setSelectedPOI(poi);
      focusBuilding(poi.geometry.location.lat, poi.geometry.location.lng);
      clearRouteInfo();
    },
    [focusBuilding, clearRouteInfo],
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

  const navigate = useCallback(
    (
      endLabel: string,
      endCoord: Coordinate,
      selectionContext?: Partial<Record<FieldType, SearchBuilding | null>>,
    ) => {
      const { coord: startCoord, label: startLabel } = resolveStartLocation();
      const startSelection =
        selectionContext?.start ?? lastManualStartSelectionRef.current ?? null;

      if (startCoord && startLabel) {
        lastStartRef.current = { coord: startCoord, label: startLabel };
      }

      setSelectionOverrides({
        start: startLabel,
        end: endLabel,
      });

      lastDestinationRef.current = {
        coord: endCoord,
        label: endLabel,
      };
      userClearedStart.current = false;
      setSelectedSearchLocations({
        start: startSelection,
        end: selectionContext?.end ?? null,
      });
      setNavCoords({ start: startCoord, end: endCoord });
      setNavigationMode("directions");
      setShouldDisplayRoutes(true);
    },
    [resolveStartLocation],
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

    const selectedEndSearch = selectedSearchLocations.end;
    const selectedEndBuildingCode = resolveSearchSelectionBuildingCode(
      selectedEndSearch,
      CAMPUS_BUILDINGS,
    );
    const isRoomDestination =
      selectedEndSearch?.isIndoorRoom &&
      selectedEndBuildingCode === selectedBuilding.buildingCode;
    const destinationLabel = isRoomDestination
      ? (selectedEndSearch.roomName ?? selectedEndSearch.buildingName)
      : selectedBuilding.buildingName;

    navigate(destinationLabel, mapBuilding.location, {
      end: isRoomDestination ? selectedEndSearch : null,
    });
  }, [selectedBuilding, selectedSearchLocations.end, navigate]);

  /**
   * Handles the navigation action when the user chooses to navigate to a selected POI. It sets the navigation coordinates to route from the user's current location  to the POI's location, and switches the navigation mode to "directions" to display the route.
   */
  const navigateToPOI = useCallback(() => {
    if (!selectedPOI) {
      return;
    }
    const endCoord = {
      latitude: selectedPOI.geometry.location.lat,
      longitude: selectedPOI.geometry.location.lng,
    };
    navigate(selectedPOI.name, endCoord);
  }, [selectedPOI, navigate]);

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

    const selectedEndSearch = selectedSearchLocations.end;
    const selectedEndBuildingCode = resolveSearchSelectionBuildingCode(
      selectedEndSearch,
      CAMPUS_BUILDINGS,
    );
    const shouldUseSelectedRoomAsStart = Boolean(
      selectedEndSearch?.isIndoorRoom &&
      selectedEndBuildingCode === selectedBuilding.buildingCode,
    );
    const startSelection = shouldUseSelectedRoomAsStart ? selectedEndSearch : null;
    const startLabel =
      startSelection?.roomName ??
      startSelection?.buildingName ??
      selectedBuilding.buildingName;

    const lastDest = lastDestinationRef.current;
    lastStartRef.current = {
      coord: mapBuilding.location,
      label: startLabel,
    };
    lastManualStartRef.current = {
      coord: mapBuilding.location,
      label: startLabel,
    };
    lastManualStartSelectionRef.current = startSelection;
    userClearedStart.current = false;
    setNavigationMode("directions");
    setShouldDisplayRoutes(lastDest.coord != null);
    setSelectionOverrides({ start: startLabel, end: lastDest.label });
    setSelectedSearchLocations({ start: startSelection, end: null });
    setNavCoords({ start: mapBuilding.location, end: lastDest.coord });
    clearRouteRendering();
  }, [
    clearRouteRendering,
    selectedBuilding,
    selectedSearchLocations.end,
  ]);

  /**
   * Handles the action of going back from the directions view to the browse mode. It resets all navigation-related state, including the navigation mode, route display, navigation coordinates, selection overrides, and any displayed routes or stops. This function is called when the user presses the back button in the RoutesInfoPopup, allowing them to exit the directions view and return to browsing the map without any active navigation routes displayed.
   */
  const handleBackFromDirections = useCallback(() => {
    userClearedStart.current = false;
    clearRouteInfo();
  }, [clearRouteInfo]);

  /**
   * Handles the action of swapping the start and end fields in the navigation directions. It updates the navigation coordinates, selection overrides, and manual start point to reflect the swap. This allows users to quickly reverse their route without having to manually re-enter the start and end locations. The function also resets any displayed routes or stops, prompting a new route calculation based on the updated coordinates. This is typically called when the user presses a swap button in the BuildingSelection component while in directions mode.
   */
  const handleSwapFields = useCallback(() => {
    // Capture current values before swapping
    const currentStart = navCoords.start;
    const currentEnd = navCoords.end;

    // Swap the coordinates
    setNavCoords({ start: currentEnd, end: currentStart });
    setSelectedSearchLocations((prev) => ({ start: prev.end, end: prev.start }));
    setSelectionOverrides((prev) => ({ start: prev.end, end: prev.start }));
    clearRouteRendering();
  }, [clearRouteRendering, navCoords.start, navCoords.end]);

  const getSelectedBuildingCode = useCallback(
    (selected: SearchBuilding | null | undefined) => {
      if (!selected || selected.buildingCode === CURRENT_LOCATION_CODE) {
        return null;
      }

      return resolveSearchSelectionBuildingCode(selected, CAMPUS_BUILDINGS);
    },
    [],
  );

  const resolveSelectionCoordinate = useCallback(
    (selected: SearchBuilding | null | undefined) => {
      if (selected?.buildingCode === CURRENT_LOCATION_CODE) {
        return userLocation;
      }

      const selectedCode = getSelectedBuildingCode(selected);
      if (!selectedCode) {
        return null;
      }

      const building = CAMPUS_BUILDINGS.find((candidate) => {
        return candidate.buildingCode === selectedCode;
      });
      return building?.location ?? null;
    },
    [getSelectedBuildingCode, userLocation],
  );

  const handleStartSelection = useCallback(
    (coord: Coordinate | null, label: string, selection: SearchBuilding | null) => {
      userClearedStart.current = !coord;
      if (coord) {
        lastStartRef.current = { coord, label };
        lastManualStartRef.current = { coord, label };
        lastManualStartSelectionRef.current = selection;
      } else {
        lastManualStartSelectionRef.current = null;
      }
    },
    [],
  );

  const handleEndSelection = useCallback(
    (selected: SearchBuilding | null, coord: Coordinate | null) => {
      if (navigationMode === "directions") {
        if (coord) {
          lastDestinationRef.current = { coord, label: selected?.buildingName ?? "" };
        } else {
          lastDestinationRef.current = { coord: null, label: "" };
        }
      }

      const selectedBuildingCode = getSelectedBuildingCode(selected);
      if (selectedBuildingCode) {
        const nextBuilding = selectBuildingByCode(selectedBuildingCode);
        if (nextBuilding) {
          focusBuilding(nextBuilding.location.latitude, nextBuilding.location.longitude);
        }
      } else {
        setSelectedBuilding(null);
      }
    },
    [focusBuilding, getSelectedBuildingCode, navigationMode, selectBuildingByCode],
  );

  const resolveIndoorRoomName = useCallback(
    (selection: SearchBuilding | null | undefined) => {
      if (!selection) {
        return null;
      }

      const roomName = (selection.roomName ?? selection.buildingName ?? "").trim();
      if (!roomName) {
        return null;
      }

      const isRoomSelection = Boolean(
        selection.isIndoorRoom || selection.parentBuildingCode || selection.roomName,
      );
      return isRoomSelection ? roomName : null;
    },
    [],
  );

  const openIndoorNavigationFromRoomSelections = useCallback(
    (selections: Record<FieldType, SearchBuilding | null>) => {
      const startSelection = selections.start;
      const endSelection = selections.end;

      const startRoom = resolveIndoorRoomName(startSelection);
      const endRoom = resolveIndoorRoomName(endSelection);
      if (!startRoom || !endRoom) {
        return false;
      }

      const startBuildingCode = getSelectedBuildingCode(startSelection);
      const endBuildingCode = getSelectedBuildingCode(endSelection);
      if (
        !startBuildingCode ||
        !endBuildingCode ||
        startBuildingCode !== endBuildingCode
      ) {
        return false;
      }

      if (!NavigationLoader.buildingHasNavigationData(startBuildingCode)) {
        return false;
      }

      const indoorPath = `/${encodeURIComponent(startBuildingCode)}?indoorStartRoom=${encodeURIComponent(startRoom)}&indoorEndRoom=${encodeURIComponent(endRoom)}`;
      userClearedStart.current = false;
      selectBuildingByCode(startBuildingCode);
      clearRouteInfo();
      router.push(indoorPath as any);
      return true;
    },
    [
      clearRouteInfo,
      getSelectedBuildingCode,
      resolveIndoorRoomName,
      selectBuildingByCode,
    ],
  );

  const filteredPlaces = useMemo(() => {
    const enabledTypes = Object.entries(poiFilters)
      .filter(([, isEnabled]) => isEnabled)
      .map(([type]) => type);

    if (enabledTypes.length === 0) {
      return [];
    }

    return places.filter((poi) =>
      poi.types?.some((type) => enabledTypes.includes(type as keyof PoiTypeFilters)),
    );
  }, [places, poiFilters]);

  useEffect(() => {
    if (!selectedPOI) {
      return;
    }

    const shouldKeepSelected = filteredPlaces.some(
      (poi) => poi.place_id === selectedPOI.place_id,
    );

    if (!shouldKeepSelected) {
      setSelectedPOI(null);
    }
  }, [filteredPlaces, selectedPOI]);

  const renderedPOIMarkers = useMemo(() => {
    return filteredPlaces.map((p) => (
      <PoiMarker key={p.place_id} poi={p} onPress={() => handlePOIPress(p)} />
    ));
  }, [filteredPlaces, handlePOIPress]);

  const selectedRoomContext = useMemo(() => {
    if (!selectedBuilding) {
      return undefined;
    }

    const selectedEndSearch = selectedSearchLocations.end;
    const selectedEndBuildingCode = getSelectedBuildingCode(selectedEndSearch);
    const isRoomDestination =
      selectedEndSearch?.isIndoorRoom &&
      selectedEndBuildingCode === selectedBuilding.buildingCode;
    if (!isRoomDestination) {
      return undefined;
    }

    return {
      roomName: selectedEndSearch.roomName ?? selectedEndSearch.buildingName,
    };
  }, [selectedBuilding, selectedSearchLocations.end, getSelectedBuildingCode]);

  const openIndoorNavigation = () => {
    if (!selectedBuilding?.buildingCode) {
      return;
    }
    router.push(`/${encodeURIComponent(selectedBuilding.buildingCode)}`);
  };

  const hasVisiblePopup =
    modalOpen ||
    navigationMode === "directions" ||
    (navigationMode === "browse" && (selectedBuilding != null || selectedPOI != null));

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
        onFocusChange={setSearchFieldFocused}
        onSwap={handleSwapFields}
        onSelect={(
          buildings: Record<FieldType, SearchBuilding | null>,
          type: FieldType,
        ) => {
          try {
            const selected = buildings?.[type] ?? null;
            const nextSelections = {
              ...selectedSearchLocations,
              [type]: selected,
            };
            if (
              navigationMode === "directions" &&
              openIndoorNavigationFromRoomSelections(nextSelections)
            ) {
              return;
            }
            const coord = resolveSelectionCoordinate(selected);

            setSelectedSearchLocations((prev) => ({
              ...prev,
              [type]: selected,
            }));
            setNavCoords((prev) => ({ ...prev, [type]: coord }));
            setSelectionOverrides((prev) => ({
              ...prev,
              [type]: selected?.buildingName ?? null,
            }));

            if (type === "start") {
              handleStartSelection(coord, selected?.buildingName ?? "", selected);
            }

            if (!coord) {
              clearRouteRendering();
              setRoutes(normalizeRoutes(EMPTY_ROUTES));
            }

            if (type === "end") {
              handleEndSelection(selected, coord);
            }
          } catch (error) {
            console.error("Failed to apply building selection:", error);
            clearRouteRendering();
            setRoutes(normalizeRoutes(EMPTY_ROUTES));
          }
        }}
      />

      <CampusToggle
        mapRef={mapViewRef}
        viewRegion={currentRegion}
        setCurrCampus={setCurrCampus}
      />

      <MapViewCluster
        ref={mapViewRef}
        testID="map-view"
        style={styles.map}
        customMapStyle={customMapStyle}
        initialRegion={initialRegion}
        showsUserLocation={!!userLocation}
        followsUserLocation={locationState === "centered"}
        clusteringEnabled={Platform.OS !== "ios"}
        showsPointsOfInterest={false}
        onPoiClick={() => {}}
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
            setSelectedPOI(null);
            clearRouteInfo();
          }
        }}
        renderCluster={renderCluster}
      >
        {renderedPolygons}
        {renderedMarkers}
        {navigationMode === "browse" ? renderedPOIMarkers : null}

        {routeOverlay.polyline?.map((segment, index) => {
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

        {shouldRenderDirectionAuxOverlays &&
          routeOverlay.stops.map((stop, index) =>
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

        {shouldRenderDirectionAuxOverlays &&
          (Platform.OS === "android"
            ? routeOverlay.nodes.map((node, index) => (
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
          : routeOverlay.nodes.map((node, index) => (
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
              )))}

          {shouldRenderDirectionAuxOverlays && navigationMode === "directions" && navCoords.start && (
          <NavEndpointMarker
            key={`nav-start-${navCoords.start.latitude}-${navCoords.start.longitude}`}
            coordinate={navCoords.start}
            label="A"
            color="#049ede"
          />
        )}

          {shouldRenderDirectionAuxOverlays && navigationMode === "directions" && navCoords.end && (
          <NavEndpointMarker
            key={`nav-end-${navCoords.end.latitude}-${navCoords.end.longitude}`}
            coordinate={navCoords.end}
            label="B"
            color="#049ede"
          />
        )}
      </MapViewCluster>

      {__DEV__ && Platform.OS === "android" && (
        <View style={styles.androidMarkerProxyContainer} pointerEvents="box-none">
          {CAMPUS_BUILDINGS.map((building) => (
            <Pressable
              key={`marker-proxy-${building.buildingCode}`}
              testID={`marker-${building.buildingCode}`}
              nativeID={`marker-${building.buildingCode}`}
              accessibilityRole="button"
              accessibilityLabel={`${building.buildingCode} ${building.buildingName}`}
              style={styles.androidMarkerProxyTarget}
              onPress={() => handleBuildingPress(building)}
            />
          ))}
        </View>
      )}

      {Array.from(inBuildingCodes).map((code) => (
        <View
          key={`highlight-label-${code}`}
          testID={`highlight-label-${code}`}
          style={styles.highlightLabelProxy}
          pointerEvents="none"
        />
      ))}

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

      <OutdoorMapSettings
        radius={radius}
        setRadius={setRadius}
        poiFilters={poiFilters}
        setPoiFilters={setPoiFilters}
        hasVisiblePopup={hasVisiblePopup}
        searchFieldFocused={searchFieldFocused}
      />

      {navigationMode === "browse" && selectedBuilding && (
        <BuildingInfoPopup
          building={selectedBuilding}
          hasIndoorNavigation={NavigationLoader.buildingHasNavigationData(
            selectedBuilding.buildingCode,
          )}
          onNavigate={navigateToBuilding}
          onSetAsStart={setBuildingAsStart}
          onExploreRooms={openIndoorNavigation}
          roomContext={selectedRoomContext}
        />
      )}

      {navigationMode === "browse" && selectedPOI && (
        <POIInfoPopup poi={selectedPOI} onNavigate={navigateToPOI} />
      )}

      {navigationMode === "directions" && (
        <RoutesInfoPopup
          routes={routes}
          isOpen={shouldDisplayRoutes}
          onBack={handleBackFromDirections}
          onModeChange={() => {
            clearRouteRendering();
          }}
          onRouteSelect={(route: any, _selectedMode: TransportationMode) => {
            // Build new route data synchronously before touching state
            const segments: PolylineSegment[] = [];
            const stops: TransitStopMarker[] = [];
            const nodes: TransitionNode[] = [];
            const allSteps = (route?.legs ?? []).flatMap((leg: any) => leg?.steps ?? []);
            const routeSteps = allSteps.filter(
              (step: any) => normalizeStepTravelMode(step?.travel_mode) !== "INDOOR",
            );
            const stepsToRender = routeSteps;

            for (let index = 0; index < stepsToRender.length; index++) {
              const step = stepsToRender[index];
              const mode = normalizeStepTravelMode(step.travel_mode);

              const encoded = step?.polyline?.points;
              if (!encoded) {
                continue;
              }

              const coords = decodePolyline(encoded);
              if (coords.length < 2) {
                continue;
              }

              const vehicleType = step.transit_details?.line?.vehicle_type;
              const color = polylineColor(mode, vehicleType);
              const isWalking = mode === "WALK";

              segments.push({ coordinates: coords, color, isDashed: isWalking });
              stops.push(...collectStopsFromStep(step, color));

              const nextStep = stepsToRender[index + 1];
              if (nextStep) {
                const node = getTransitionNode(coords, color, nextStep);
                if (node) nodes.push(node);
              }
            }

            const normalizedSegments =
              Platform.OS === "ios" ? coalesceRouteSegments(segments) : segments;
            const normalizedStops = Platform.OS === "ios" ? [] : stops;
            const normalizedNodes = Platform.OS === "ios" ? [] : nodes;

            cancelPendingRouteRender();
            // Apply overlay updates together to avoid iOS-native child index races.
            setRouteKey((key) => key + 1);
            setRouteOverlay({
              polyline: normalizedSegments.length > 0 ? normalizedSegments : null,
              stops: normalizedStops,
              nodes: normalizedNodes,
            });
          }}
          onStepSelect={(
            encoded: string,
            travelMode: string,
            _vehicleType: string | undefined,
            context?: RouteStepSelectionContext,
          ) => {
            if ((travelMode ?? "").toUpperCase() === "INDOOR") {
              const indoorDetails = decodeIndoorStepPayload(encoded);
              const outdoorResumeStep = buildOutdoorStepResume(context?.nextStep);
              const resumeContinuationId = outdoorResumeStep
                ? OutdoorStepResume.saveContinuation(outdoorResumeStep)
                : null;

              let indoorPath: string | null = null;
              if (
                indoorDetails?.building_code &&
                indoorDetails?.start_checkpoint_id &&
                indoorDetails?.end_room
              ) {
                indoorPath = `/${encodeURIComponent(indoorDetails.building_code)}?indoorStartCheckpointId=${encodeURIComponent(indoorDetails.start_checkpoint_id)}&indoorEndRoom=${encodeURIComponent(indoorDetails.end_room)}`;
              } else if (
                indoorDetails?.building_code &&
                indoorDetails?.start_room &&
                indoorDetails?.end_checkpoint_id
              ) {
                indoorPath = `/${encodeURIComponent(indoorDetails.building_code)}?indoorStartRoom=${encodeURIComponent(indoorDetails.start_room)}&indoorEndCheckpointId=${encodeURIComponent(indoorDetails.end_checkpoint_id)}`;
              }

              if (!indoorPath) {
                if (resumeContinuationId) {
                  OutdoorStepResume.clearContinuation(resumeContinuationId);
                }
                return;
              }

              if (resumeContinuationId) {
                indoorPath = `${indoorPath}&resumeContinuationId=${encodeURIComponent(resumeContinuationId)}`;
              }
              activeIndoorStepSessionRef.current = {
                resumeContinuationId,
              };
              router.push(indoorPath as any);
              return;
            }

            focusRouteStep(encoded);
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
        key={building.buildingCode}
        coordinate={building.location}
        onPress={() => onPress(building)}
      >
        <View
          testID={
            Platform.OS === "android" ? undefined : `marker-${building.buildingCode}`
          }
          nativeID={
            Platform.OS === "android" ? undefined : `marker-${building.buildingCode}`
          }
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${building.buildingCode} ${building.buildingName}`}
          accessibilityHint={`Shows details for ${building.buildingName}`}
          collapsable={false}
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
  radiusContainer: {
    position: "absolute",
    left: "30%",
    right: "25%",
    bottom: 42,
    zIndex: 15,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#3a0b09", //UI changes on the POI slider container colour
  },
  radiusHeader: {
    flexDirection: "row",
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  radiusLabel: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  radiusValue: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700" as const,
  },
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

  androidMarkerProxyContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
  },
  androidMarkerProxyTarget: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0.01,
    zIndex: 10,
  },
  highlightLabelProxy: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0.01,
    zIndex: 1,
  },
});

const customMapStyle: MapStyleElement[] = [
  {
    featureType: "poi",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
];

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
