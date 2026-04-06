import { LOY_CENTER, SGW_CENTER } from "@/constants/campusCenters";
import { CAMPUS_BUILDINGS } from "@/constants/map";
import { Colors, PoiMarkerColors } from "@/constants/theme";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { IndoorMapSettings } from "@/globals/IndoorMapSettingsStore";
import { OutdoorRouteStep, OutdoorStepResume } from "@/globals/OutdoorStepResumeStore";
import { ColorSchemeName, useColorScheme } from "@/hooks/use-color-scheme";
import { usePoi } from "@/hooks/use-poi";
import { FieldType, SearchBuilding, TransportationMode } from "@/types/buildingTypes";
import { BuildingInfo, Campus, Coordinate, CoordinateDelta, POI, Region } from "@/types/mapTypes";
import { isPointInPolygon } from "@/utils/currentBuilding/pointInPolygon";
import { decodePolyline } from "@/utils/decodePolyline";
import { fetchAllDirections } from "@/utils/directions";
import {
  decodeIndoorStepPayload,
  enrichRoutesWithIndoorTransitions,
  resolveSearchSelectionBuildingCode,
} from "@/utils/hybridNavigation";
import { normalizeSearchToken } from "@/utils/roomSearch";
import { buildIndoorRoomRouteFromSelections } from "@/utils/roomSelectionNavigation";
import * as LocationPermissions from "expo-location";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
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
import RoutesInfoPopup, {
  RouteStepSelectionContext,
} from "../navigation/routes-info-popup";
import BuildingInfoPopup from "./building-info-popup";
import BuildingSelection, { CURRENT_LOCATION_CODE } from "./building-selection";
import CampusToggle from "./campus-toggle";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";
import OutdoorMapSettings from "./outdoor-map-settings";
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

interface MapRefLike {
  animateToRegion: (region: Region) => void;
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

const EMPTY_ROUTES: Record<TransportationMode, any[] | null> = {
  walking: null,
  transit: null,
  driving: null,
  bicycling: null,
  shuttle: null,
};

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

function getCampusForRegion(region: Region): Campus {
  const sgwDistance = Math.hypot(
    region.latitude - SGW_CENTER.latitude,
    region.longitude - SGW_CENTER.longitude,
  );
  const loyDistance = Math.hypot(
    region.latitude - LOY_CENTER.latitude,
    region.longitude - LOY_CENTER.longitude,
  );
  return sgwDistance <= loyDistance ? "SGW" : "LOY";
}

function getPoiMarkerColor(types: string[]): string {
  const typeSet = new Set(types.map((type) => type.toLowerCase()));

  if (typeSet.has("cafe")) {
    return PoiMarkerColors.cafe;
  }
  if (typeSet.has("restaurant")) {
    return PoiMarkerColors.restaurant;
  }
  if (typeSet.has("library")) {
    return PoiMarkerColors.library;
  }
  if (typeSet.has("park")) {
    return PoiMarkerColors.park;
  }
  if (typeSet.has("shopping_mall") || typeSet.has("store")) {
    return PoiMarkerColors.shopping;
  }
  if (typeSet.has("supermarket")) {
    return PoiMarkerColors.supermarket;
  }
  if (typeSet.has("gym")) {
    return PoiMarkerColors.gym;
  }

  return PoiMarkerColors.default;
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

function WebMapEvents({
  onRegionChangeComplete,
  onMapPress,
}: Readonly<MapEventsBinderProps>) {
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
  const { buildingId, autoNavigate, destinationRoom } = useLocalSearchParams<{
    buildingId?: string;
    autoNavigate?: string;
    destinationRoom?: string;
  }>();

  const mapViewRef = useRef<MapRefLike | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const suppressNextMapPress = useRef(false);
  const activeIndoorStepSessionRef = useRef<{
    resumeContinuationId: string | null;
  } | null>(null);
  const suppressMapPressOnce = useCallback(() => {
    suppressNextMapPress.current = true;
    requestAnimationFrame(() => {
      suppressNextMapPress.current = false;
    });
  }, []);

  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationButtonProps["state"]>("off");
  const [modalOpen, setModalOpen] = useState(false);
  const [radius, setRadius] = useState(0);
  const [searchFieldFocused, setSearchFieldFocused] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(defaultInitialRegion);
  const currCampus = useMemo(() => getCampusForRegion(currentRegion), [currentRegion]);
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

  const focusRouteStep = useCallback((encodedPolyline: string) => {
    const coords = decodePolyline(encodedPolyline);
    if (coords.length < 2) {
      return;
    }

    const mid = coords[Math.floor(coords.length / 2)];
    mapViewRef.current?.animateToRegion({
      latitude: mid.latitude,
      longitude: mid.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  }, []);

  const clearRouteInfo = useCallback(() => {
    activeIndoorStepSessionRef.current = null;
    lastDestinationRef.current = { coord: null, label: "" };
    setNavigationMode("browse");
    setShouldDisplayRoutes(false);
    setRoutes({ ...EMPTY_ROUTES });
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
    setNavCoords({ start: null, end: null });
    setSelectionOverrides({ start: null, end: null });
    setSelectedSearchLocations({ start: null, end: null });

    requestAnimationFrame(() => {
      suppressNextMapPress.current = false;
    });
  }, []);

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
        activeIndoorStepSessionRef.current = null;
        return;
      }

      activeIndoorStepSessionRef.current = null;
      focusRouteStep(pendingStep.encodedPolyline);
    }, [focusRouteStep]),
  );

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
        const fetchedRoutes = await fetchAllDirections(navCoords.start!, navCoords.end!);
        const indoorSettings = await IndoorMapSettings.getSettings().catch(() =>
          IndoorMapSettings.getCachedSettings(),
        );
        const nextRoutes = await enrichRoutesWithIndoorTransitions(
          fetchedRoutes,
          {
            start: selectedSearchLocations.start,
            end: selectedSearchLocations.end,
          },
          CAMPUS_BUILDINGS,
          {
            accessibleOnly: indoorSettings.wheelchairOnly,
          },
        );
        if (!cancelled) {
          setRoutes(nextRoutes);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch directions:", error);
          setRoutes(EMPTY_ROUTES);
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

  const filteredPlaces = useMemo(() => {
    const enabledTypes = Object.entries(poiFilters)
      .filter(([, isEnabled]) => isEnabled)
      .map(([type]) => type);

    if (enabledTypes.length === 0) {
      return [];
    }

    return places.filter((poi) => poi.types?.some((type) => enabledTypes.includes(type)));
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

  const focusCoordinate = useCallback(
    (latitude: number, longitude: number) => {
      mapViewRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: Math.min(currentRegion.latitudeDelta, 0.0025),
        longitudeDelta: Math.min(currentRegion.longitudeDelta, 0.0025),
      });
    },
    [currentRegion.latitudeDelta, currentRegion.longitudeDelta],
  );

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

  const focusBuilding = useCallback(
    (building: BuildingInfo) => {
      focusCoordinate(building.location.latitude, building.location.longitude);
    },
    [focusCoordinate],
  );

  const openIndoorNavigation = useCallback(() => {
    if (!selectedBuilding?.buildingCode) {
      return;
    }

    if (!NavigationLoader.buildingHasNavigationData(selectedBuilding.buildingCode)) {
      return;
    }

    if (Platform.OS === "web" && typeof document !== "undefined") {
      (document.activeElement as HTMLElement | null)?.blur();
    }

    const selectedEndSearch = selectedSearchLocations.end;
    const selectedEndBuildingCode =
      !selectedEndSearch || selectedEndSearch.buildingCode === CURRENT_LOCATION_CODE
        ? null
        : resolveSearchSelectionBuildingCode(selectedEndSearch, CAMPUS_BUILDINGS);
    const isRoomDestination =
      selectedEndSearch?.isIndoorRoom &&
      selectedEndBuildingCode === selectedBuilding.buildingCode;
    const roomName = isRoomDestination
      ? (selectedEndSearch.roomName ?? selectedEndSearch.buildingName ?? "").trim()
      : "";
    suppressNextMapPress.current = true;
    router.push({
      pathname: "/[buildingCode]",
      params: roomName
        ? {
            buildingCode: selectedBuilding.buildingCode,
            indoorEndRoom: roomName,
          }
        : { buildingCode: selectedBuilding.buildingCode },
    } as any);
  }, [selectedBuilding, selectedSearchLocations.end]);

  const selectBuildingByCode = useCallback((code: string) => {
    const nextBuilding =
      CAMPUS_BUILDINGS.find((building) => building.buildingCode === code) || null;
    setSelectedBuilding(nextBuilding);
    return nextBuilding;
  }, []);

  useEffect(() => {
    if (!buildingId) {
      return;
    }

    const nextBuilding = selectBuildingByCode(buildingId);
    if (nextBuilding) {
      setSelectedPOI(null);
      focusBuilding(nextBuilding);

      const trimmedDestinationRoom = destinationRoom?.trim() ?? "";
      const destinationSelection: SearchBuilding | null = trimmedDestinationRoom
        ? {
            buildingCode: trimmedDestinationRoom,
            buildingName: trimmedDestinationRoom,
            address: nextBuilding.address,
            campus: nextBuilding.campus,
            parentBuildingCode: nextBuilding.buildingCode,
            roomName: trimmedDestinationRoom,
            isIndoorRoom: true,
          }
        : null;

      if (autoNavigate === "true") {
        const destinationLabel =
          destinationSelection?.roomName ?? nextBuilding.buildingName;

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
          end: destinationLabel,
        });
        lastDestinationRef.current = {
          coord: nextBuilding.location,
          label: destinationLabel,
        };
        userClearedStart.current = false;
        setSelectedSearchLocations({ start: null, end: destinationSelection });
        setNavCoords({ start: startCoord, end: nextBuilding.location });
        setNavigationMode("directions");
        setShouldDisplayRoutes(true);
      } else {
        clearRouteInfo();
        if (destinationSelection) {
          setSelectedSearchLocations({ start: null, end: destinationSelection });
        }
      }
    }

    router.setParams({
      buildingId: "",
      buildingName: "",
      autoNavigate: "",
      destinationRoom: "",
    });
  }, [
    buildingId,
    autoNavigate,
    destinationRoom,
    selectBuildingByCode,
    focusBuilding,
    clearRouteInfo,
    inBuildingCodes,
    userLocation,
  ]);

  const handleBuildingPress = useCallback(
    (building: BuildingInfo) => {
      setSelectedPOI(null);
      suppressNextMapPress.current = true;
      selectBuildingByCode(building.buildingCode);
      focusBuilding(building);
      clearRouteInfo();
    },
    [clearRouteInfo, focusBuilding, selectBuildingByCode],
  );

  const handlePOIPress = useCallback(
    (poi: POI) => {
      setSelectedBuilding(null);
      setSelectedPOI(poi);
      focusCoordinate(poi.geometry.location.lat, poi.geometry.location.lng);
      clearRouteInfo();
    },
    [clearRouteInfo, focusCoordinate],
  );

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

  const resolveStartLocation = useCallback(() => {
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
      return { coord: startCoord, label: startLabel };
    }

    return { coord: null, label: null };
  }, [inBuildingCodes, userLocation]);

  const navigate = useCallback(
    (
      endLabel: string,
      endCoord: Coordinate,
      selectionContext?: Partial<Record<FieldType, SearchBuilding | null>>,
    ) => {
      const { coord: startCoord, label: startLabel } = resolveStartLocation();
      const startSelection =
        selectionContext?.start ??
        lastManualStartSelectionRef.current ??
        selectedSearchLocations.start ??
        null;

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
    [resolveStartLocation, selectedSearchLocations.start],
  );

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
    const selectedEndBuildingCode =
      !selectedEndSearch || selectedEndSearch.buildingCode === CURRENT_LOCATION_CODE
        ? null
        : resolveSearchSelectionBuildingCode(selectedEndSearch, CAMPUS_BUILDINGS);
    const isRoomDestination =
      selectedEndSearch?.isIndoorRoom &&
      selectedEndBuildingCode === selectedBuilding.buildingCode;
    const destinationLabel = isRoomDestination
      ? (selectedEndSearch.roomName ?? selectedEndSearch.buildingName)
      : selectedBuilding.buildingName;

    navigate(destinationLabel, mapBuilding.location, {
      end: isRoomDestination ? selectedEndSearch : null,
    });
  }, [navigate, selectedBuilding, selectedSearchLocations.end]);

  const navigateToPOI = useCallback(() => {
    if (!selectedPOI) {
      return;
    }

    navigate(selectedPOI.name, {
      latitude: selectedPOI.geometry.location.lat,
      longitude: selectedPOI.geometry.location.lng,
    });
  }, [navigate, selectedPOI]);

  const setBuildingAsStart = useCallback(() => {
    if (!selectedBuilding) {
      return;
    }

    const selectedEndSearch = selectedSearchLocations.end;
    const selectedEndBuildingCode =
      !selectedEndSearch || selectedEndSearch.buildingCode === CURRENT_LOCATION_CODE
        ? null
        : resolveSearchSelectionBuildingCode(selectedEndSearch, CAMPUS_BUILDINGS);
    const shouldUseSelectedRoomAsStart =
      selectedEndSearch?.isIndoorRoom &&
      selectedEndBuildingCode === selectedBuilding.buildingCode;

    const mapBuilding = CAMPUS_BUILDINGS.find(
      (building) => building.buildingCode === selectedBuilding.buildingCode,
    );
    if (!mapBuilding) {
      return;
    }

    const startSelection = shouldUseSelectedRoomAsStart ? selectedEndSearch : null;
    const startLabel =
      startSelection?.roomName ??
      startSelection?.buildingName ??
      selectedBuilding.buildingName;

    const lastDest = lastDestinationRef.current;
    const shouldClearDestination =
      Boolean(lastDest.coord) &&
      Boolean(lastDest.label) &&
      normalizeSearchToken(lastDest.label) === normalizeSearchToken(startLabel);
    const nextDestinationCoord = shouldClearDestination ? null : lastDest.coord;
    const nextDestinationLabel = shouldClearDestination ? "" : lastDest.label;

    lastStartRef.current = {
      coord: mapBuilding.location,
      label: startLabel,
    };
    lastManualStartRef.current = {
      coord: mapBuilding.location,
      label: startLabel,
    };
    lastManualStartSelectionRef.current = startSelection;
    if (shouldClearDestination) {
      lastDestinationRef.current = { coord: null, label: "" };
    }
    userClearedStart.current = false;
    setNavigationMode("directions");
    setShouldDisplayRoutes(nextDestinationCoord != null);
    setSelectionOverrides({ start: startLabel, end: nextDestinationLabel });
    setSelectedSearchLocations({ start: startSelection, end: null });
    setNavCoords({ start: mapBuilding.location, end: nextDestinationCoord });
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
  }, [selectedBuilding, selectedSearchLocations.end]);

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

  const clearRouteRendering = useCallback(() => {
    setRoutePolyline(null);
    setRouteStops([]);
    setRouteNodes([]);
  }, []);

  const openIndoorNavigationFromRoomSelections = useCallback(
    (selections: Record<FieldType, SearchBuilding | null>) => {
      const indoorRouteParams = buildIndoorRoomRouteFromSelections(
        selections,
        CAMPUS_BUILDINGS,
      );
      if (!indoorRouteParams) {
        return false;
      }

      if (!NavigationLoader.buildingHasNavigationData(indoorRouteParams.buildingCode)) {
        return false;
      }

      userClearedStart.current = false;
      selectBuildingByCode(indoorRouteParams.buildingCode);
      clearRouteInfo();
      router.push({
        pathname: "/[buildingCode]",
        params: indoorRouteParams,
      } as any);
      return true;
    },
    [clearRouteInfo, selectBuildingByCode],
  );

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

      const building = CAMPUS_BUILDINGS.find((b) => b.buildingCode === selectedCode);
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
      if (coord) {
        lastDestinationRef.current = { coord, label: selected?.buildingName ?? "" };
      }

      const selectedBuildingCode = getSelectedBuildingCode(selected);
      if (selectedBuildingCode) {
        setSelectedPOI(null);
        const nextBuilding = selectBuildingByCode(selectedBuildingCode);
        if (nextBuilding) {
          focusBuilding(nextBuilding);
        }
      } else {
        setSelectedBuilding(null);
      }
    },
    [focusBuilding, getSelectedBuildingCode, selectBuildingByCode],
  );

  const handleSwapFields = useCallback(() => {
    const currentStart = navCoords.start;
    const currentEnd = navCoords.end;
    const currentStartSelection = selectedSearchLocations.start;
    const currentEndSelection = selectedSearchLocations.end;
    const currentStartLabel = selectionOverrides.start;
    const currentEndLabel = selectionOverrides.end;
    const swappedSelections = {
      start: currentEndSelection,
      end: currentStartSelection,
    };

    if (openIndoorNavigationFromRoomSelections(swappedSelections)) {
      return;
    }

    setRoutes({ ...EMPTY_ROUTES });
    setShouldDisplayRoutes(false);

    if (currentEnd && currentEndLabel) {
      lastStartRef.current = { coord: currentEnd, label: currentEndLabel };
      lastManualStartRef.current = { coord: currentEnd, label: currentEndLabel };
    } else {
      lastManualStartRef.current = { coord: null, label: "" };
    }
    lastManualStartSelectionRef.current = currentEndSelection;
    userClearedStart.current = !currentEnd;

    if (currentStart && currentStartLabel) {
      lastDestinationRef.current = { coord: currentStart, label: currentStartLabel };
    } else {
      lastDestinationRef.current = { coord: null, label: "" };
    }

    const swappedEndBuildingCode = getSelectedBuildingCode(swappedSelections.end);
    if (swappedEndBuildingCode) {
      const nextBuilding = selectBuildingByCode(swappedEndBuildingCode);
      if (nextBuilding) {
        focusBuilding(nextBuilding);
      }
    } else {
      setSelectedBuilding(null);
    }

    setNavCoords({ start: currentEnd, end: currentStart });
    setSelectedSearchLocations(swappedSelections);
    setSelectionOverrides({
      start: currentEndLabel,
      end: currentStartLabel,
    });
    clearRouteRendering();
  }, [
    clearRouteRendering,
    focusBuilding,
    getSelectedBuildingCode,
    navCoords.end,
    navCoords.start,
    openIndoorNavigationFromRoomSelections,
    selectBuildingByCode,
    selectedSearchLocations.end,
    selectedSearchLocations.start,
    selectionOverrides.end,
    selectionOverrides.start,
  ]);

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

  const hasVisiblePopup =
    modalOpen ||
    navigationMode === "directions" ||
    (navigationMode === "browse" && (selectedBuilding != null || selectedPOI != null));

  const onMapRegionChangeComplete = useCallback(
    (region: Region) => {
      setCurrentRegion(region);

      const latDiff = Math.abs(region.latitude - (userLocation?.latitude ?? 0));
      const lonDiff = Math.abs(region.longitude - (userLocation?.longitude ?? 0));

      if (userLocation && latDiff < 0.0001 && lonDiff < 0.0001) {
        setLocationState("centered");
      } else if (userLocation) {
        setLocationState("on");
      }
    },
    [userLocation],
  );

  const onMapPress = useCallback(() => {
    if (suppressNextMapPress.current) {
      suppressNextMapPress.current = false;
      return;
    }

    setSelectedBuilding(null);
    setSelectedPOI(null);
    clearRouteInfo();
  }, [clearRouteInfo]);

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
        onFocusChange={setSearchFieldFocused}
        onSwap={handleSwapFields}
        onSelect={(
          buildings: Record<FieldType, SearchBuilding | null>,
          type: FieldType,
        ) => {
          suppressMapPressOnce();
          const selected = buildings[type];
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
          }

          if (type === "end") {
            handleEndSelection(selected, coord);
          }
        }}
      />

      <CampusToggle mapRef={mapViewRef} viewRegion={currentRegion} />

      <View style={styles.map}>
        <WebMapContainer
          center={[initialRegion.latitude, initialRegion.longitude]}
          zoom={regionToZoom(initialRegion)}
          style={styles.leafletMap}
          zoomControl={false}
        >
          <MapRefBridge onMapReady={handleMapReady} />
          <WebMapEvents
            onRegionChangeComplete={onMapRegionChangeComplete}
            onMapPress={onMapPress}
          />
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
                  positions={polygonData.map((point) => [
                    point.latitude,
                    point.longitude,
                  ])}
                  pathOptions={{
                    color: mapColors.polygonStroke,
                    fillColor: polygonColor,
                    fillOpacity: 0.7,
                    weight: 2,
                  }}
                  eventHandlers={{ click: () => handleBuildingPress(building) }}
                />
              )),
              <WebCircleMarker
                key={`marker-${building.buildingCode}`}
                center={[building.location.latitude, building.location.longitude]}
                radius={8}
                pathOptions={{
                  color: isSelected
                    ? mapColors.markerBorderSelected
                    : mapColors.markerBorder,
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

          {navigationMode === "browse" &&
            filteredPlaces.map((poi) => {
              const isSelected = selectedPOI?.place_id === poi.place_id;

              return (
                <WebCircleMarker
                  key={`poi-${poi.place_id}`}
                  center={[poi.geometry.location.lat, poi.geometry.location.lng]}
                  radius={isSelected ? 10 : 8}
                  pathOptions={{
                    color: PoiMarkerColors.border,
                    fillColor: getPoiMarkerColor(poi.types ?? []),
                    fillOpacity: 0.95,
                    weight: isSelected ? 3 : 2,
                  }}
                  eventHandlers={{ click: () => handlePOIPress(poi) }}
                />
              );
            })}

          {routePolyline?.map((segment, index) => (
            <WebLeafletPolyline
              key={`route-seg-${index}-${segment.color}`}
              positions={segment.coordinates.map((point) => [
                point.latitude,
                point.longitude,
              ])}
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
              pathOptions={{
                color: stop.color,
                fillColor: "#fff",
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}

          {routeNodes.map((node, index) => (
            <WebCircleMarker
              key={`node-${index}-${node.coordinate.latitude}-${node.coordinate.longitude}`}
              center={[node.coordinate.latitude, node.coordinate.longitude]}
              radius={7}
              pathOptions={{
                color: "#fff",
                fillColor: node.toColor,
                fillOpacity: 1,
                weight: 3,
              }}
            />
          ))}

          {navigationMode === "directions" && navCoords.start && (
            <WebCircleMarker
              center={[navCoords.start.latitude, navCoords.start.longitude]}
              radius={10}
              pathOptions={{
                color: "#049ede",
                fillColor: "#049ede",
                fillOpacity: 1,
                weight: 2,
              }}
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
              pathOptions={{
                color: "#049ede",
                fillColor: "#049ede",
                fillOpacity: 1,
                weight: 2,
              }}
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
              pathOptions={{
                color: "#1a73e8",
                fillColor: "#1a73e8",
                fillOpacity: 0.95,
                weight: 2,
              }}
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
          onRouteSelect={(route: any) => {
            const segments: PolylineSegment[] = [];
            const stops: TransitStopMarker[] = [];
            const nodes: TransitionNode[] = [];
            const allSteps = (route?.legs ?? []).flatMap((leg: any) => leg?.steps ?? []);
            const routeSteps = allSteps.filter(
              (step: any) => normalizeStepTravelMode(step?.travel_mode) !== "INDOOR",
            );

            for (let index = 0; index < routeSteps.length; index++) {
              const step = routeSteps[index];
              const encoded = step?.polyline?.points;
              if (!encoded) {
                continue;
              }

              const coords = decodePolyline(encoded);
              if (coords.length < 2) {
                continue;
              }

              const mode = normalizeStepTravelMode(step.travel_mode);
              const vehicleType = step.transit_details?.line?.vehicle_type;
              const color = polylineColor(mode, vehicleType);
              const isWalking = mode === "WALK";

              segments.push({ coordinates: coords, color, isDashed: isWalking });
              stops.push(...collectStopsFromStep(step, color));

              const nextStep = routeSteps[index + 1];
              if (nextStep) {
                const node = getTransitionNode(coords, color, nextStep);
                if (node) nodes.push(node);
              }
            }

            setRoutePolyline(segments.length > 0 ? segments : null);
            setRouteStops(stops);
            setRouteNodes(nodes);
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

              let indoorRoute: {
                pathname: string;
                params: Record<string, string>;
              } | null = null;
              if (
                indoorDetails?.building_code &&
                indoorDetails?.start_checkpoint_id &&
                indoorDetails?.end_room
              ) {
                indoorRoute = {
                  pathname: "/[buildingCode]",
                  params: {
                    buildingCode: indoorDetails.building_code,
                    indoorStartCheckpointId: indoorDetails.start_checkpoint_id,
                    indoorEndRoom: indoorDetails.end_room,
                  },
                };
              } else if (
                indoorDetails?.building_code &&
                indoorDetails?.start_room &&
                indoorDetails?.end_checkpoint_id
              ) {
                indoorRoute = {
                  pathname: "/[buildingCode]",
                  params: {
                    buildingCode: indoorDetails.building_code,
                    indoorStartRoom: indoorDetails.start_room,
                    indoorEndCheckpointId: indoorDetails.end_checkpoint_id,
                  },
                };
              }

              if (!indoorRoute) {
                if (resumeContinuationId) {
                  OutdoorStepResume.clearContinuation(resumeContinuationId);
                }
                return;
              }

              if (resumeContinuationId) {
                indoorRoute = {
                  pathname: indoorRoute.pathname,
                  params: {
                    ...indoorRoute.params,
                    resumeContinuationId,
                  },
                };
              }
              activeIndoorStepSessionRef.current = {
                resumeContinuationId,
              };
              router.push(indoorRoute as any);
              return;
            }

            focusRouteStep(encoded);
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
