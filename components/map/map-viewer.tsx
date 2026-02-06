import React, { useRef, useState, useCallback, useMemo } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import MapView, { Marker, Polygon, PolygonPressEvent, Region } from "react-native-maps";
import * as LocationPermissions from "expo-location";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { CAMPUS_LOCATIONS } from "@/constants/mapData";
import { concordiaBuildings, BuildingInfo } from "@/data/parsedBuildings";
import { Coordinate, CoordinateDelta, Building as MapBuilding } from "@/types/mapTypes";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";
import BuildingInfoPopup from "./building-info-popup";

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
  const currentRegion = useRef<Region>(defaultInitialRegion);

  const focusBuilding = useCallback((building: MapBuilding) => {
    mapViewRef.current?.animateToRegion({
      latitude: building.location.latitude,
      longitude: building.location.longitude,
      latitudeDelta: currentRegion?.current.latitudeDelta < 0.0025 ? currentRegion?.current.latitudeDelta : 0.0025,
      longitudeDelta: currentRegion?.current.longitudeDelta < 0.0025 ? currentRegion?.current.longitudeDelta : 0.0025,
    });
  }, []);

  const selectBuildingByCode = useCallback((code: string) => {
    const info = concordiaBuildings.find((b) => b.buildingCode === code) ?? null;
    setSelectedBuilding(info);
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

    setLocationState("centered");
    mapViewRef.current?.animateToRegion({ ...userLocation, ...userLocationDelta });
  }, [userLocation, userLocationDelta]);

  const renderPolygons = useMemo(() => {
    return CAMPUS_LOCATIONS.flatMap((building) =>
      building.polygons.map((polygon, index) => {
        const isSelected = selectedBuilding?.buildingCode === building.code;

        return (
          <Polygon
            key={`${building.code}-${index}`}
            coordinates={polygon}
            tappable
            fillColor={isSelected ? mapColors.polygonHighlighted : mapColors.polygonFill}
            zIndex={isSelected ? 2 : 1}
            strokeColor={mapColors.polygonStroke}
            strokeWidth={2}
            onPress={() => handlePolygonPress(building)}
          />
        );
      })
    );
  }, [mapColors, selectedBuilding?.buildingCode, handlePolygonPress]);

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
        // RA overlaps with PC
        coordinate = {
          latitude: building.location.latitude - 0.00008,
          longitude: building.location.longitude - 0.00015,
        };
      }

      return (
        <Marker
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
      <MapViewCluster
        ref={mapViewRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={!!userLocation}
        followsUserLocation={locationState === "centered"}
        clusteringEnabled={Platform.OS !== "ios"}
        onRegionChangeComplete={(region) => {currentRegion.current = region}}
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
          }
        }}
        renderCluster={renderCluster}
      >
        {renderPolygons}
        {renderMarkers}
      </MapViewCluster>

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
  map: { width: "100%", height: "100%" },
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
