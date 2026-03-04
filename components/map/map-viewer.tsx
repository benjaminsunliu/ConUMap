import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import MapView, { Marker, Polygon, Polyline, Region } from "react-native-maps";
import * as LocationPermissions from "expo-location";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { CAMPUS_LOCATIONS } from "@/constants/mapData";
import { concordiaBuildings, BuildingInfo } from "@/data/parsedBuildings";
import { Coordinate, CoordinateDelta, Building as MapBuilding } from "@/types/mapTypes";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";
import BuildingInfoPopup from "./building-info-popup";
import { isPointInPolygon } from "@/utils/currentBuilding/pointInPolygon";
import CampusToggle from "./campus-toggle";
import BuildingSelection from "./building-selection";
import RoutesInfoPopup from "../navigation/routes-info-popup";
import { fetchAllDirections } from "@/utils/directions";
import { decodePolyline } from "@/utils/decodePolyline";
import { TransportationMode } from "@/types/buildingTypes";

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
  const colorScheme = useColorScheme() ?? "light";
  const mapColors = Colors[colorScheme].map;
  const mapViewRef = useRef<MapView>(null);
  const suppressNextMapPress = useRef(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationButtonProps["state"]>("off");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(defaultInitialRegion);
  const [polygonRenderVersion, setPolygonRenderVersion] = useState(0);
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

    for (const building of CAMPUS_LOCATIONS) {
      for (const polygon of building.polygons) {
        if (isPointInPolygon(userLocation, polygon)) {
          codes.add(building.code);
          break;
        }
      }
    }
    return codes;
  }, [userLocation]);

  const focusBuilding = useCallback((building: MapBuilding) => {
    mapViewRef.current?.animateToRegion({
      latitude: building.location.latitude,
      longitude: building.location.longitude,
      latitudeDelta: currentRegion.latitudeDelta < 0.0025 ? currentRegion.latitudeDelta : 0.0025,
      longitudeDelta: currentRegion.longitudeDelta < 0.0025 ? currentRegion.longitudeDelta : 0.0025,
    });
  }, [currentRegion.latitudeDelta, currentRegion.longitudeDelta]);

  const selectBuildingByCode = useCallback((code: string) => {
    const info = concordiaBuildings.find((b) => b.buildingCode === code) ?? null;
    setSelectedBuilding(info);
    setPolygonRenderVersion(v => v + 1);
  }, []);

  const handlePolygonPress = useCallback((building: MapBuilding) => {
    suppressNextMapPress.current = true;
    selectBuildingByCode(building.code);
    focusBuilding(building);
    setShouldDisplayRoutes(false);
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
    setNavCoords({ start: null, end: null });

    requestAnimationFrame(() => {
      suppressNextMapPress.current = false;
    });
  }, [selectBuildingByCode, focusBuilding]);

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
    setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    setLocationState("on");

  }, [userLocation]);


  const centerLocation = useCallback(() => {
    if (!userLocation) return;

    mapViewRef.current?.animateToRegion({ ...userLocation, ...userLocationDelta });
    setLocationState("centered");
  }, [userLocation, userLocationDelta]);

  const renderPolygons = useMemo(() => {
    return CAMPUS_LOCATIONS.flatMap((building) =>
      building.polygons.map((polygon, index) => {
        const isSelected = selectedBuilding?.buildingCode === building.code;
        const isInBuilding = inBuildingCodes.has(building.code);

        let finalFillColor: string;

        if (isSelected && isInBuilding) {
          finalFillColor = mapColors.currentSelectedBuildingColor;
        } else if (isSelected) {
          finalFillColor = mapColors.polygonHighlighted;
        } else if (isInBuilding) {
          finalFillColor = mapColors.currentBuildingColor;
        } else {
          finalFillColor = mapColors.polygonFill;
        }

        let finalZIndex: number;
        if (isSelected) {
          finalZIndex = 3;
        } else if (isInBuilding) {
          finalZIndex = 2;
        } else {
          finalZIndex = 1;
        }

        return (
          <Polygon
            // On iOS, use render version to force re-render and prevent polygon disappearing.
            // On Android, use state-based keys to only remount changed polygons and avoid flashing.
            key={
              Platform.OS === "ios"
                ? `${building.code}-${index}-v${polygonRenderVersion}`
                : `${building.code}-${index}-${isSelected}-${isInBuilding}`
            }
            testID="polygon"
            coordinates={polygon}
            tappable
            fillColor={finalFillColor}
            zIndex={finalZIndex}
            strokeColor={mapColors.polygonStroke}
            strokeWidth={2}
            onPress={() => handlePolygonPress(building)}
          />
        );
      })
    );
  }, [mapColors, selectedBuilding?.buildingCode, inBuildingCodes, handlePolygonPress, polygonRenderVersion]);

  const renderMarkers = useMemo(() => {
    return CAMPUS_LOCATIONS.map((building) => {
      const isSelected = selectedBuilding?.buildingCode === building.code;

      // Offset markers to prevent overlaps
      let coordinate = building.location;
      if (building.code === "VE") {
        // VE overlaps with VL
        coordinate = {
          latitude: building.location.latitude + 0.00008,
          longitude: building.location.longitude - 0.00015,
        };
      } else if (building.code === "RA") {
        // Misplaced marker for RA
        coordinate = {
          latitude: building.location.latitude - 0.0009,
          longitude: building.location.longitude - 0.0008,
        };
      } else if (building.code === "PC") {
        // Misplaced marker for PC
        coordinate = {
          latitude: building.location.latitude - 0.0006,
          longitude: building.location.longitude - 0.0005,
        };
      }

      return (
        <Marker
          testID={`marker-${building.code}`}
          key={building.code}
          coordinate={coordinate}
          onPress={() => { handlePolygonPress(building) }}
        >
          <View
            style={[
              styles.marker,
              {
                backgroundColor: isSelected ? mapColors.markerSelected : mapColors.marker,
                borderColor: isSelected ? mapColors.markerBorderSelected : mapColors.markerBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.markerText,
                { color: isSelected ? mapColors.markerTextSelected : mapColors.markerText },
              ]}
            >
              {building.code}
            </Text>
          </View>
        </Marker>
      );
    });
  }, [selectedBuilding?.buildingCode, mapColors.markerSelected, mapColors.marker, mapColors.markerBorderSelected, mapColors.markerBorder, mapColors.markerTextSelected, mapColors.markerText, handlePolygonPress]);

  const renderCluster = useCallback(
    (cluster: Cluster) => {
      const { id, geometry, properties, onPress } = cluster;
      const count = properties.point_count ?? 0;

      return (
        <Marker
          key={`cluster-${id}`}
          coordinate={{ latitude: geometry.coordinates[1], longitude: geometry.coordinates[0] }}
          onPress={onPress}>
          <View
            style={[
              styles.clusterMarker,
              { backgroundColor: mapColors.clusterMarker, borderColor: mapColors.markerBorder }
            ]}>
            <Text style={[styles.clusterText, { color: mapColors.clusterText }]}> {count > 9 ? "9+" : count} </Text>
          </View>
        </Marker>
      );
    },
    [mapColors]
  );

  const navigateToBuilding = useCallback(() => {
    if (!selectedBuilding) return;

    const mapBuilding = CAMPUS_LOCATIONS.find(b => b.code === selectedBuilding.buildingCode);
    if (!mapBuilding) return;

    let startCoord: Coordinate | null = null;
    let startLabel: string | null = null;

    if (inBuildingCodes.size > 0) {
      const firstCode = [...inBuildingCodes][0];
      const startBuilding = concordiaBuildings.find(b => b.buildingCode === firstCode);
      const startMapBuilding = CAMPUS_LOCATIONS.find(b => b.code === firstCode);
      startLabel = startBuilding?.buildingName ?? firstCode;
      startCoord = startMapBuilding?.location ?? userLocation ?? null;
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
            ? CAMPUS_LOCATIONS.find(b => b.code === building.buildingCode)?.location ?? null
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
              selectBuildingByCode(building.buildingCode);
              const mapBuilding = CAMPUS_LOCATIONS.find(b => b.code === building.buildingCode);
              if (mapBuilding) focusBuilding(mapBuilding);
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
          if (!coordinate || typeof coordinate.latitude !== "number" || typeof coordinate.longitude !== "number") return;
          if (!userLocation) setLocationState("on");
          setUserLocation({ latitude: coordinate.latitude, longitude: coordinate.longitude });
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
            setPolygonRenderVersion(v => v + 1);
          }
        }}
        renderCluster={renderCluster}
      >
        {renderPolygons}
        {renderMarkers}
        {routePolyline?.map((segment, idx) => (
          <Polyline
            key={`polyline-seg-${idx}`}
            coordinates={segment.coordinates}
            strokeColor={segment.color}
            strokeWidth={segment.isDashed ? 3 : 4}
            lineDashPattern={segment.isDashed ? [1, 8] : undefined}
            zIndex={10}
          />
        ))}
        {routeStops.map((stop, idx) => (
          <Marker
            key={`stop-${idx}`}
            coordinate={stop.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#fff",
              borderWidth: 2,
              borderColor: stop.color,
            }} />
          </Marker>
        ))}
        {routeNodes.map((node, idx) => (
          <Marker
            key={`node-${idx}`}
            coordinate={node.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: node.toColor,
              borderWidth: 3,
              borderColor: "#fff",
            }} />
          </Marker>
        ))}
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

            // Transition node where the mode changes to the next step
            const nextStep = allSteps[i + 1];
            if (nextStep) {
              const nextMode = nextStep.travel_mode ?? "WALK";
              if (nextMode.toUpperCase() !== mode.toUpperCase()) {
                const junction = coords[coords.length - 1];
                const nextColor = polylineColor(nextMode, nextStep.transit_details?.line?.vehicle_type);
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", flex: 1 },
  marker: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2
  },
  markerText: {
    fontWeight: "700",
    fontSize: 12,
  },
  clusterMarker: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 2
  },
  clusterText: {
    fontWeight: "800",
    fontSize: 12
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
