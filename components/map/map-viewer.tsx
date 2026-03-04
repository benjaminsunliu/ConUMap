import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet, View, Text, Platform, Pressable } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import MapView, { Marker, Polygon, Region } from "react-native-maps";
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
  const [polygonRenderVersion, setPolygonRenderVersion] = useState(0);
  const [projectedPoints, setProjectedPoints] = useState< { building: MapBuilding; x: number; y: number }[] >([]);
  const [mapReady, setMapReady] = useState(false);

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
            accessibilityLabel="concordia-building"
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

  const getMarkerCoordinate = (building: MapBuilding) => {
    if (building.code === "VE") {
      return {
        latitude: building.location.latitude + 0.00008,
        longitude: building.location.longitude - 0.00015,
      };
    }
    if (building.code === "RA") {
      return {
        latitude: building.location.latitude - 0.0009,
        longitude: building.location.longitude - 0.0008,
      };
    }
    if (building.code === "PC") {
      return {
        latitude: building.location.latitude - 0.0006,
        longitude: building.location.longitude - 0.0005,
      };
    }
    return building.location;
  }

   if (IS_E2E) {
    useEffect(() => { 
      async function updateHitboxPositions() { 
        if (!mapReady || !mapViewRef.current) 
          return; 
        const next:{building: MapBuilding; x: number; y: number }[] = []; 
        for (const building of CAMPUS_LOCATIONS as MapBuilding[]) { 
          const coord = getMarkerCoordinate(building); 
          const point = await mapViewRef.current.pointForCoordinate(coord); 
          next.push({ building, x: point.x, y: point.y }); 
        } 
        setProjectedPoints(next); 
      } updateHitboxPositions();
    }, [currentRegion]);
  }

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
          onPress={() => {
            selectBuildingByCode(building.code);
            focusBuilding(building);
          }}
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
  }, [mapColors, selectedBuilding?.buildingCode, focusBuilding, selectBuildingByCode]);

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

  return (
    <View style={styles.container}>
      <BuildingSelection
        onSelect={(building) => {
          selectBuildingByCode(building.buildingCode);
          const mapBuilding = CAMPUS_LOCATIONS.find((b) => b.code === building.buildingCode);
          if (mapBuilding) focusBuilding(mapBuilding);
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
          setUserLocation({ latitude: coordinate.latitude, longitude: coordinate.longitude });
        }}
        spiralEnabled={false}
        onPress={(e) => {
          if (suppressNextMapPress.current) return;
          const action = e?.nativeEvent?.action;

          if (!action || action === "press") {
            setSelectedBuilding(null);
            setPolygonRenderVersion(v => v + 1);
          }
        }}
        renderCluster={renderCluster}
      >
        {renderPolygons}
        {renderMarkers}
      </MapViewCluster>
{IS_E2E && ( 
  <View 
  style={{ 
    position: "absolute", 
    top: 0, 
    left: 0, 
    width: 1,
    height: 1,
    }} 
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
      <BuildingInfoPopup building={selectedBuilding} />
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
