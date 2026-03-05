import { CAMPUS_BUILDINGS } from "@/constants/map";
import { Colors } from "@/constants/theme";
import { ColorSchemeName, useColorScheme } from "@/hooks/use-color-scheme";
import { BuildingInfo, Coordinate, CoordinateDelta } from "@/types/mapTypes";
import { TransportationMode } from "@/types/buildingTypes";
import { isPointInPolygon } from "@/utils/currentBuilding/pointInPolygon";
import { decodePolyline } from "@/utils/decodePolyline";
import { fetchAllDirections } from "@/utils/directions";
import * as LocationPermissions from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import MapView, { Circle, Marker, Polygon, Polyline, Region } from "react-native-maps";
import RoutesInfoPopup from "../navigation/routes-info-popup";
import BuildingInfoPopup from "./building-info-popup";
import BuildingSelection from "./building-selection";
import CampusToggle from "./campus-toggle";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";

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

/** Returns a stroke colour for a polyline segment based on travel mode and vehicle type. */
function polylineColor(travelMode: string, vehicleType?: string): string {
  const mode = travelMode?.toUpperCase();
  if (mode === "TRANSIT") {
    switch (vehicleType) {
      case "BUS": return "#049ede";
      case "TRAM":
      case "SUBWAY":
      case "RAIL":
      case "HEAVY_RAIL": return "#480efa";
      default: return "#1a73e8";
    }
  }
  return "#1a73e8";
}

interface Props {
  readonly userLocationDelta?: CoordinateDelta;
  readonly initialRegion?: Region;
}

interface Cluster {
  id: string | number;
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
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
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationButtonProps["state"]>("off");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(
    null,
  );
  const [currentRegion, setCurrentRegion] = useState<Region>(defaultInitialRegion);
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
  const [navCoords, setNavCoords] = useState<{ start: Coordinate | null; end: Coordinate | null }>({
    start: null,
    end: null,
  });
  const [selectionOverrides, setSelectionOverrides] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });
  // Persists across route dismissals so "Directions" can reuse the last manually-chosen start
  const [manualStart, setManualStart] = useState<{ coord: Coordinate | null; label: string }>({
    coord: null,
    label: "",
  });
  const showStartHint = shouldDisplayRoutes && navCoords.start === null;

  // Auto-fetch directions whenever both endpoints are known
  useEffect(() => {
    if (!navCoords.start || !navCoords.end) return;
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
    setShouldDisplayRoutes(true);
    fetchAllDirections(navCoords.start, navCoords.end).then(setRoutes);
  }, [navCoords]);

  const inBuildingCodes = useMemo(() => {
    const codes = new Set<string>();
    if (!userLocation) return codes;

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

  const selectBuildingByCode = useCallback((code: string) => {
    const selectedBuilding =
      CAMPUS_BUILDINGS.find((building) => building.buildingCode === code) || null;
    setSelectedBuilding(selectedBuilding);
    return selectedBuilding;
  }, []);

  const handleBuildingPress = useCallback(
    (building: BuildingInfo) => {
      suppressNextMapPress.current = true;
      selectBuildingByCode(building.buildingCode);
      focusBuilding(building);
      setShouldDisplayRoutes(false);
      setRoutePolyline(null);
      setRouteStops([]);
      setRouteNodes([]);
      setNavCoords({ start: null, end: null });

      requestAnimationFrame(() => {
        suppressNextMapPress.current = false;
      });
    },
    [selectBuildingByCode, focusBuilding],
  );

  const requestLocation = useCallback(async () => {
    if (userLocation) return;
    const locationEnabled = await LocationPermissions.hasServicesEnabledAsync();
    if (!locationEnabled) {
      setModalOpen(true);
      return;
    }

    const { status } = await LocationPermissions.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await LocationPermissions.getCurrentPositionAsync();
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    setLocationState("on");
  }, [userLocation]);

  const centerLocation = useCallback(() => {
    if (!userLocation) return;

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

  const navigateToBuilding = useCallback(() => {
    if (!selectedBuilding) return;

    const mapBuilding = CAMPUS_BUILDINGS.find(b => b.buildingCode === selectedBuilding.buildingCode);
    if (!mapBuilding) return;

    let startCoord: Coordinate | null = null;
    let startLabel: string | null = null;

    if (inBuildingCodes.size > 0) {
      const firstCode = [...inBuildingCodes][0];
      const startBuilding = CAMPUS_BUILDINGS.find(b => b.buildingCode === firstCode);
      startLabel = startBuilding?.buildingName ?? firstCode;
      startCoord = startBuilding?.location ?? userLocation ?? null;
    } else if (userLocation) {
      startLabel = "Current Location";
      startCoord = userLocation;
    } else if (manualStart.coord) {
      startLabel = manualStart.label;
      startCoord = manualStart.coord;
    }

    setSelectionOverrides({
      start: startLabel ?? "",
      end: selectedBuilding.buildingName,
    });

    setNavCoords({ start: startCoord, end: mapBuilding.location });
    setShouldDisplayRoutes(true);
  }, [userLocation, selectedBuilding, inBuildingCodes, manualStart]);

  return (
    <View style={styles.container}>
      <BuildingSelection
        currentBuildingCodes={inBuildingCodes}
        startOverride={selectionOverrides.start}
        endOverride={selectionOverrides.end}
        startHint={showStartHint ? "Please select a start location" : null}
        onSelect={(building, type) => {
          const coord = building.buildingCode
            ? CAMPUS_BUILDINGS.find(b => b.buildingCode === building.buildingCode)?.location ?? null
            : null;

          setNavCoords(prev => ({ ...prev, [type]: coord }));

          if (type === "start") {
            setManualStart({ coord, label: building.buildingName });
          }

          if (!coord) {
            setRoutePolyline(null);
            setRouteStops([]);
            setRouteNodes([]);
          }

          if (type === "end") {
            if (building.buildingCode) {
              const newBuilding = selectBuildingByCode(building.buildingCode);
              if (newBuilding) focusBuilding(newBuilding);
            }
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
          if (userLocation) setLocationState("on");
        }}
        onUserLocationChange={({ nativeEvent }) => {
          const coordinate = nativeEvent?.coordinate;
          if (!coordinate) return;
          if (!userLocation) setLocationState("on");
          setUserLocation({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
          });
        }}
        spiralEnabled={false}
        onPress={(e) => {
          if (suppressNextMapPress.current) return;
          const action = e?.nativeEvent?.action;

          if (!action || action === "press") {
            setSelectedBuilding(null);
            setShouldDisplayRoutes(false);
            setRoutePolyline(null);
            setRouteStops([]);
            setRouteNodes([]);
            setNavCoords({ start: null, end: null });
          }
        }}
        renderCluster={renderCluster}
      >
        {renderedPolygons}
        {renderedMarkers}
        {routePolyline?.map((segment, idx) => {
          const strokeWidth = segment.isDashed ? (Platform.OS === "android" ? 6 : 3) : 3;
          return (
            <Polyline
              key={`polyline-seg-${idx}-${segment.isDashed}`}
              coordinates={segment.coordinates}
              strokeColor={segment.color}
              strokeWidth={strokeWidth}
              {...(segment.isDashed ? { lineDashPattern: Platform.OS === "android" ? [8, 16] : [1, 8] } : {})}
              zIndex={10}
            />
          );
        })}
        {routeStops.map((stop) =>
          Platform.OS === "android" ? (
            <Circle
              key={`stop-${stop.coordinate.latitude}-${stop.coordinate.longitude}`}
              center={stop.coordinate}
              radius={5}
              fillColor="#fff"
              strokeColor={stop.color}
              strokeWidth={2}
              zIndex={11}
            />
          ) : (
            <Marker
              key={`stop-${stop.coordinate.latitude}-${stop.coordinate.longitude}`}
              coordinate={stop.coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={11}
            >
              <View collapsable={false} style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#fff",
                borderWidth: 2,
                borderColor: stop.color,
              }} />
            </Marker>
          )
        )}
        {Platform.OS === "android"
          ? routeNodes.map((node) => (
            <Circle
              key={`node-${node.coordinate.latitude}-${node.coordinate.longitude}`}
              center={node.coordinate}
              radius={7}
              fillColor={node.toColor}
              strokeColor="#fff"
              strokeWidth={3}
              zIndex={12}
            />
          ))
          : routeNodes.map((node) => (
            <Marker
              key={`node-${node.coordinate.latitude}-${node.coordinate.longitude}`}
              coordinate={node.coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={12}
            >
              <View collapsable={false} style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: node.toColor,
                borderWidth: 3,
                borderColor: "#fff",
              }} />
            </Marker>
          ))
        }
      </MapViewCluster>

      <LocationButton
        state={locationState}
        onPress={() => {
          if (locationState === "on") centerLocation();
          else if (locationState === "off") requestLocation();
        }}
      />
      <LocationModal visible={modalOpen} onRequestClose={() => setModalOpen(false)} />
      <BuildingInfoPopup building={selectedBuilding} onNavigate={navigateToBuilding} />
      <RoutesInfoPopup
        routes={routes}
        isOpen={shouldDisplayRoutes}
        onRouteSelect={(route) => {
          const segments: PolylineSegment[] = [];
          const stops: TransitStopMarker[] = [];
          const nodes: TransitionNode[] = [];
          const allSteps = (route?.legs ?? []).flatMap((leg: any) => leg?.steps ?? []);

          for (let i = 0; i < allSteps.length; i++) {
            const step = allSteps[i];
            const encoded = step?.polyline?.points;
            if (!encoded) continue;
            const coords = decodePolyline(encoded);
            if (coords.length < 2) continue;

            const mode = step.travel_mode ?? "WALK";
            const vehicleType = step.transit_details?.line?.vehicle_type;
            const color = polylineColor(mode, vehicleType);
            const isWalking = mode.toUpperCase() === "WALK" || mode.toUpperCase() === "WALKING";

            segments.push({ coordinates: coords, color, isDashed: isWalking });

            // Collect transit departure / arrival stop markers
            const dep = step.transit_details?.departure_stop;
            const arr = step.transit_details?.arrival_stop;
            if (dep?.location)
              stops.push({ coordinate: { latitude: dep.location.lat, longitude: dep.location.lng }, name: dep.name ?? "", color });
            if (arr?.location)
              stops.push({ coordinate: { latitude: arr.location.lat, longitude: arr.location.lng }, name: arr.name ?? "", color });

            // Transition node where the mode or vehicle type changes to the next step
            const nextStep = allSteps[i + 1];
            if (nextStep) {
              const nextMode = nextStep.travel_mode ?? "WALK";
              const nextVehicleType = nextStep.transit_details?.line?.vehicle_type;
              const nextColor = polylineColor(nextMode, nextVehicleType);
              if (nextColor !== color) {
                const junction = coords.at(-1);
                nodes.push({ coordinate: junction, fromColor: color, toColor: nextColor });
              }
            }
          }

          setRoutePolyline(segments.length > 0 ? segments : null);
          setRouteStops(stops);
          setRouteNodes(nodes);
        }}
        onStepSelect={(encoded, travelMode, vehicleType) => {
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
    </View>
  );
}

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
        key={`${building.buildingCode}`}
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
