import { CAMPUS_BUILDINGS } from "@/constants/map";
import { Colors } from "@/constants/theme";
import mockRoutes from "@/data/mock-data/route-data.json";
import { ColorSchemeName, useColorScheme } from "@/hooks/use-color-scheme";
import { BuildingInfo, Coordinate, CoordinateDelta } from "@/types/mapTypes";
import { isPointInPolygon } from "@/utils/currentBuilding/pointInPolygon";
import * as LocationPermissions from "expo-location";
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Platform, StyleSheet, Text, View, Pressable } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import MapView, { Marker, Polygon, Region } from "react-native-maps";
import RoutesInfoPopup from "../navigation/routes-info-popup";
import BuildingInfoPopup from "./building-info-popup";
import BuildingSelection from "./building-selection";
import CampusToggle from "./campus-toggle";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";
import { IS_E2E } from "@/utils/e2e";

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
  const [shouldDisplayRoutes, setShouldDisplayRoutes] = useState(false);
  const [routes, setRoutes] = useState(mockRoutes);
  const [projectedPoints, setProjectedPoints] = useState< { building: MapBuilding; x: number; y: number }[] >([]);
  const [mapReady, setMapReady] = useState(false);

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

const getOffsetMarkerCoordinate = useCallback((building: MapBuilding) => { 
      // Offset markers to prevent overlaps

    if (building.code === "VE") { 
      // VE overlaps with VL
      return { 
        latitude: building.location.latitude + 0.00008, 
        longitude: building.location.longitude - 0.00015, 
      }; 
    } 
    if (building.code === "RA") { 
      // Misplaced marker for RA
      return { 
        latitude: building.location.latitude - 0.0009, 
        longitude: building.location.longitude - 0.0008, 
      }; 
    } 
    if (building.code === "PC") { 
      // Misplaced marker for PC
      return { 
        latitude: building.location.latitude - 0.0006, 
        longitude: building.location.longitude - 0.0005, 
      }; 
    } 
    return building.location; 
  },[]);

    useEffect(() => { 
      if (!IS_E2E) {
        return;
      }
    if (!currentRegion) {
        return;
      }
      let isCancelled = false;
      async function updateHitboxPositions() { 
        if (!mapReady || !mapViewRef.current || isCancelled) {
          setProjectedPoints([]);
          return;
        } 
        try {
          const { latitude, longitude, latitudeDelta, longitudeDelta } = currentRegion;
          const minLat = latitude - latitudeDelta / 2;
          const maxLat = latitude + latitudeDelta / 2;
          const minLng = longitude - longitudeDelta / 2;
          const maxLng = longitude + longitudeDelta / 2;
          const visibleBuildings = (CAMPUS_LOCATIONS as MapBuilding[]).filter((building) => {
            const coord = getOffsetMarkerCoordinate(building);
            return (
              coord.latitude >= minLat &&
              coord.latitude <= maxLat &&
              coord.longitude >= minLng &&
              coord.longitude <= maxLng
            );
          });
          if (!visibleBuildings.length || !mapViewRef.current || isCancelled) {
            setProjectedPoints([]);
            return;
          }
          const projections = await Promise.all(
            visibleBuildings.map(async (building) => {
              if (!mapViewRef.current || isCancelled) {
                return null;
              }
              const coord = getOffsetMarkerCoordinate(building);
              const point = await mapViewRef.current.pointForCoordinate(coord);
              return { building, x: point.x, y: point.y };
            })
          );
          if (isCancelled) {
            return;
          }
          const next: { building: MapBuilding; x: number; y: number }[] = [];
          for (const result of projections) {
            if (result) {
              next.push(result);
            }
          }
          if (!isCancelled) {
            setProjectedPoints(next); 
          }
        } catch (error) {
          if (IS_E2E) {
            console.warn("Failed to update hitbox positions", error);
            setProjectedPoints([]);
          }
        }
      } 
      updateHitboxPositions();
      return () => {
        isCancelled = true;
      };
    }, [IS_E2E, CAMPUS_LOCATIONS,currentRegion, mapReady, getOffsetMarkerCoordinate]);
  

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
    // TODO Call backend to get route from current location to building
    setRoutes(mockRoutes);
    setShouldDisplayRoutes(true);
  }, []);

  return (
    <View style={styles.container}>
      <BuildingSelection
        currentBuildingCodes={inBuildingCodes}
        onSelect={(building) => {
          setShouldDisplayRoutes(false);
          const newBuilding = selectBuildingByCode(building.buildingCode);
          if (newBuilding) focusBuilding(newBuilding);
        }}
      />
      <CampusToggle mapRef={mapViewRef} viewRegion={currentRegion} />
      <MapViewCluster
        onMapReady={() => setMapReady(true)}
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
          }
        }}
        renderCluster={renderCluster}
      >
        {renderedPolygons}
        {renderedMarkers}
      </MapViewCluster>
{IS_E2E && ( 
  <View 
    pointerEvents="box-none"
    style={StyleSheet.absoluteFillObject}
    > 
      {projectedPoints.map(({ building, x, y }) => ( 
        <Pressable 
        key={`e2e-${building.code}`} 
        testID={`e2e-marker-${building.code}`} 
        style={{ 
          position: "absolute", 
          top: y - 20, 
          left: x - 20, 
          width: 40, 
          height: 40, 
          opacity: 0.01, 
          zIndex: 9999, 
          }} 
          onPress={() => { 
            selectBuildingByCode(building.code); 
            focusBuilding(building); 
            }} 
            /> 
      ))}
      {/* Highlighted buildings */}
           {Array.from(inBuildingCodes).map((code) => (
             <View
               key={`highlight-label-${code}`}
               testID={`highlight-label-${code}`}
               style={{
                 position: "absolute",
                 top: 0,
                 left: 0,
                 width: 1,
                 height: 1,
                 opacity: 0.01,
               }}
             />
           ))}      
    </View>
    )}
      <LocationButton
        state={locationState}
        onPress={() => {
          if (locationState === "on") centerLocation();
          else if (locationState === "off") requestLocation();
        }}
      />
      <LocationModal visible={modalOpen} onRequestClose={() => setModalOpen(false)} />
      <BuildingInfoPopup building={selectedBuilding} onNavigate={navigateToBuilding} />
      <RoutesInfoPopup routes={routes} isOpen={shouldDisplayRoutes} onRouteSelect={(route) => {
        //TODO implement onRouteSelect
      }}/>
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
