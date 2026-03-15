import { CAMPUS_BUILDINGS } from "@/constants/map";
import { Colors } from "@/constants/theme";
import { ColorSchemeName, useColorScheme } from "@/hooks/use-color-scheme";
import { FieldType, SearchBuilding, TransportationMode } from "@/types/buildingTypes";
import { BuildingInfo, Coordinate, CoordinateDelta, Region } from "@/types/mapTypes";
import { isPointInPolygon } from "@/utils/currentBuilding/pointInPolygon";
import { decodePolyline } from "@/utils/decodePolyline";
import { fetchAllDirections } from "@/utils/directions";
import * as LocationPermissions from "expo-location";
import { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  CircleMarker,
  MapContainer,
  Polygon as LeafletPolygon,
  Polyline as LeafletPolyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import RoutesInfoPopup from "../navigation/routes-info-popup";
import BuildingInfoPopup from "./building-info-popup";
import BuildingSelection, { CURRENT_LOCATION_CODE } from "./building-selection";
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

interface MapRefLike {
  animateToRegion: (region: Region) => void;
}

const WebMapContainer = MapContainer as any;
const WebTileLayer = TileLayer as any;
const WebLeafletPolygon = LeafletPolygon as any;
const WebLeafletPolyline = LeafletPolyline as any;
const WebCircleMarker = CircleMarker as any;
const WebTooltip = Tooltip as any;

interface Props {
  readonly userLocationDelta?: CoordinateDelta;
  readonly initialRegion?: Region;
}

interface MapEventsBinderProps {
  onRegionChangeComplete: (region: Region) => void;
  onMapPress: () => void;
}

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

function regionToZoom(region: Region): number {
  const delta = Math.max(region.longitudeDelta, 0.0001);
  const zoom = Math.round(Math.log2(360 / delta));
  return Math.max(2, Math.min(20, zoom));
}

function mapToRegion(map: LeafletMap): Region {
  const center = map.getCenter();
  const bounds = map.getBounds();
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  return {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: Math.max(0.0001, ne.lat - sw.lat),
    longitudeDelta: Math.max(0.0001, ne.lng - sw.lng),
  };
}

function WebMapEvents({ onRegionChangeComplete, onMapPress }: Readonly<MapEventsBinderProps>) {
  useMapEvents({
    click: () => {
      onMapPress();
    },
    moveend: (event: any) => {
      const map = event.target;
      onRegionChangeComplete(mapToRegion(map));
    },
    zoomend: (event: any) => {
      const map = event.target;
      onRegionChangeComplete(mapToRegion(map));
    },
  });

  return null;
}

function MapRefBridge({
  onMapReady,
}: Readonly<{ onMapReady: (map: LeafletMap) => void }>) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
}

export default function MapViewer({
  userLocationDelta = defaultFocusDelta,
  initialRegion = defaultInitialRegion,
}: Props) {
  const colorScheme = useColorScheme();
  const mapColors = Colors[colorScheme].map;

  const mapViewRef = useRef<MapRefLike | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
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

  const showStartHint =
    navigationMode === "directions" && navCoords.end != null && navCoords.start == null;

  const handleMapReady = useCallback((map: LeafletMap) => {
    leafletMapRef.current = map;
    mapViewRef.current = {
      animateToRegion: (region: Region) => {
        const zoom = regionToZoom(region);
        map.flyTo([region.latitude, region.longitude], zoom, { duration: 0.3 });
      },
    };
  }, []);

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

      if (lastManualStartRef.current.coord && lastManualStartRef.current.label) {
        startCoord = lastManualStartRef.current.coord;
        startLabel = lastManualStartRef.current.label;
      } else if (inBuildingCodes.size > 0) {
        const firstCode = [...inBuildingCodes][0];
        const startBuilding = CAMPUS_BUILDINGS.find(
          (building) => building.buildingCode === firstCode,
        );
        startLabel = startBuilding?.buildingName ?? firstCode;
        startCoord = startBuilding?.location ?? null;
      } else if (userLocation) {
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

  const focusBuilding = useCallback((building: BuildingInfo) => {
    mapViewRef.current?.animateToRegion({
      latitude: building.location.latitude,
      longitude: building.location.longitude,
      latitudeDelta: Math.min(currentRegion.latitudeDelta, 0.0025),
      longitudeDelta: Math.min(currentRegion.longitudeDelta, 0.0025),
    });
  }, [currentRegion.latitudeDelta, currentRegion.longitudeDelta]);

  const selectBuildingByCode = useCallback((code: string) => {
    const nextBuilding =
      CAMPUS_BUILDINGS.find((building) => building.buildingCode === code) || null;
    setSelectedBuilding(nextBuilding);
    return nextBuilding;
  }, []);

  const handleBuildingPress = useCallback((building: BuildingInfo) => {
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
  }, [selectBuildingByCode, focusBuilding]);

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

  const centerLocation = useCallback(() => {
    if (!userLocation) {
      return;
    }

    mapViewRef.current?.animateToRegion({ ...userLocation, ...userLocationDelta });
    setLocationState("centered");
  }, [userLocation, userLocationDelta]);

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

    if (lastManualStartRef.current.coord && lastManualStartRef.current.label) {
      startCoord = lastManualStartRef.current.coord;
      startLabel = lastManualStartRef.current.label;
    } else if (inBuildingCodes.size > 0) {
      const firstCode = [...inBuildingCodes][0];
      const startBuilding = CAMPUS_BUILDINGS.find(
        (building) => building.buildingCode === firstCode,
      );
      startLabel = startBuilding?.buildingName ?? firstCode;
      startCoord = startBuilding?.location ?? userLocation ?? null;
    } else if (userLocation) {
      startLabel = "Current Location";
      startCoord = userLocation;
    } else if (lastStartRef.current.coord && lastStartRef.current.label) {
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

  const handleSwapFields = useCallback(() => {
    const currentStart = navCoords.start;
    const currentEnd = navCoords.end;

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

  const resolveSelectionCoordinate = useCallback((selectedCode?: string) => {
    if (selectedCode === CURRENT_LOCATION_CODE) {
      return userLocation;
    }
    if (!selectedCode) {
      return null;
    }

    const building = CAMPUS_BUILDINGS.find((b) => b.buildingCode === selectedCode);
    return building?.location ?? null;
  }, [userLocation]);

  const handleStartSelection = useCallback((coord: Coordinate | null, label: string) => {
    userClearedStart.current = !coord;
    if (coord) {
      lastStartRef.current = { coord, label };
      lastManualStartRef.current = { coord, label };
    }
  }, []);

  const handleEndSelection = useCallback((selected: SearchBuilding | null, coord: Coordinate | null) => {
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
  }, [focusBuilding, selectBuildingByCode]);

  const onMapRegionChangeComplete = useCallback((region: Region) => {
    setCurrentRegion(region);

    const latDiff = Math.abs(region.latitude - (userLocation?.latitude ?? 0));
    const lonDiff = Math.abs(region.longitude - (userLocation?.longitude ?? 0));

    if (userLocation && latDiff < 0.0001 && lonDiff < 0.0001) {
      setLocationState("centered");
    } else if (userLocation) {
      setLocationState("on");
    }
  }, [userLocation]);

  const onMapPress = useCallback(() => {
    if (suppressNextMapPress.current) {
      return;
    }

    setSelectedBuilding(null);
    setNavigationMode("browse");
    setShouldDisplayRoutes(false);
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
    setNavCoords({ start: null, end: null });
    setSelectionOverrides({ start: null, end: null });
  }, []);

  useEffect(() => {
    if (locationState !== "centered" || !userLocation || !leafletMapRef.current) {
      return;
    }

    const map = leafletMapRef.current;
    map.flyTo([userLocation.latitude, userLocation.longitude], map.getZoom(), {
      duration: 0.3,
    });
  }, [locationState, userLocation, currentRegion.latitude, currentRegion.longitude]);

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
        onSelect={(buildings: Record<FieldType, SearchBuilding | null>, type: FieldType) => {
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

      <CampusToggle mapRef={mapViewRef as any} viewRegion={currentRegion} />

      <View style={styles.map}>
        <WebMapContainer
          center={[initialRegion.latitude, initialRegion.longitude]}
          zoom={regionToZoom(initialRegion)}
          style={styles.leafletMap}
          zoomControl={false}
        >
          <MapRefBridge onMapReady={handleMapReady} />
          <WebMapEvents onRegionChangeComplete={onMapRegionChangeComplete} onMapPress={onMapPress} />
          <WebTileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {CAMPUS_BUILDINGS.flatMap((building, buildingIndex) => {
            const isSelected = selectedBuilding?.buildingCode === building.buildingCode;
            const isInBuilding = inBuildingCodes.has(building.buildingCode);
            const polygonColor = getPolygonColor(isSelected, isInBuilding, colorScheme);

            return [
              ...building.polygons.map((polygonData, polygonIndex) => (
                <WebLeafletPolygon
                  key={`poly-${buildingIndex}-${polygonIndex}-${isInBuilding}`}
                  positions={polygonData.map((point) => [point.latitude, point.longitude])}
                  pathOptions={{ color: mapColors.polygonStroke, fillColor: polygonColor, fillOpacity: 0.7, weight: 2 }}
                  eventHandlers={{ click: () => handleBuildingPress(building) }}
                />
              )),
              <WebCircleMarker
                key={`marker-${building.buildingCode}`}
                center={[building.location.latitude, building.location.longitude]}
                radius={8}
                pathOptions={{
                  color: isSelected ? mapColors.markerBorderSelected : mapColors.markerBorder,
                  fillColor: isSelected ? mapColors.markerSelected : mapColors.marker,
                  fillOpacity: 1,
                  weight: 2,
                }}
                eventHandlers={{ click: () => handleBuildingPress(building) }}
              >
                <WebTooltip direction="top" offset={[0, -6]} opacity={1} permanent>
                  {building.buildingCode}
                </WebTooltip>
              </WebCircleMarker>,
            ];
          })}

          {routePolyline?.map((segment, index) => (
            <WebLeafletPolyline
              key={`route-seg-${index}-${segment.color}`}
              positions={segment.coordinates.map((point) => [point.latitude, point.longitude])}
              pathOptions={{
                color: segment.color,
                weight: segment.isDashed ? 4 : 5,
                dashArray: segment.isDashed ? "6 10" : undefined,
              }}
            />
          ))}

          {routeStops.map((stop, index) => (
            <WebCircleMarker
              key={`stop-${index}-${stop.coordinate.latitude}-${stop.coordinate.longitude}`}
              center={[stop.coordinate.latitude, stop.coordinate.longitude]}
              radius={5}
              pathOptions={{ color: stop.color, fillColor: "#fff", fillOpacity: 1, weight: 2 }}
            />
          ))}

          {routeNodes.map((node, index) => (
            <WebCircleMarker
              key={`node-${index}-${node.coordinate.latitude}-${node.coordinate.longitude}`}
              center={[node.coordinate.latitude, node.coordinate.longitude]}
              radius={7}
              pathOptions={{ color: "#fff", fillColor: node.toColor, fillOpacity: 1, weight: 3 }}
            />
          ))}

          {navigationMode === "directions" && navCoords.start && (
            <WebCircleMarker
              center={[navCoords.start.latitude, navCoords.start.longitude]}
              radius={10}
              pathOptions={{ color: "#049ede", fillColor: "#049ede", fillOpacity: 1, weight: 2 }}
            >
              <WebTooltip direction="top" offset={[0, -8]} opacity={1} permanent>
                A
              </WebTooltip>
            </WebCircleMarker>
          )}
          {navigationMode === "directions" && navCoords.end && (
            <WebCircleMarker
              center={[navCoords.end.latitude, navCoords.end.longitude]}
              radius={10}
              pathOptions={{ color: "#049ede", fillColor: "#049ede", fillOpacity: 1, weight: 2 }}
            >
              <WebTooltip direction="top" offset={[0, -8]} opacity={1} permanent>
                B
              </WebTooltip>
            </WebCircleMarker>
          )}

          {userLocation && (
            <WebCircleMarker
              center={[userLocation.latitude, userLocation.longitude]}
              radius={7}
              pathOptions={{ color: "#1a73e8", fillColor: "#1a73e8", fillOpacity: 0.95, weight: 2 }}
            />
          )}
        </WebMapContainer>
      </View>

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

            setRoutePolyline(segments.length > 0 ? segments : null);
            setRouteStops(stops);
            setRouteNodes(nodes);
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", flex: 1 },
  leafletMap: {
    width: "100%",
    height: "100%",
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
