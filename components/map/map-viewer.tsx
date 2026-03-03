import { CAMPUS_BUILDINGS } from "@/constants/map";
import { Colors } from "@/constants/theme";
import mockRoutes from "@/data/mock-data/route-data.json";
import { ColorSchemeName, useColorScheme } from "@/hooks/use-color-scheme";
import { BuildingInfo, Coordinate, CoordinateDelta } from "@/types/mapTypes";
import { isPointInPolygon } from "@/utils/currentBuilding/pointInPolygon";
import * as LocationPermissions from "expo-location";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import MapView, { Marker, Polygon, Region } from "react-native-maps";
import RoutesInfoPopup from "../navigation/routes-info-popup";
import BuildingInfoPopup from "./building-info-popup";
import BuildingSelection from "./building-selection";
import CampusToggle from "./campus-toggle";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";

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
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(defaultInitialRegion);
  const [shouldDisplayRoutes, setShouldDisplayRoutes] = useState(false);
  const [routes, setRoutes] = useState(mockRoutes);
  const [navigationMode, setNavigationMode] = useState<"browse" | "directions">("browse");

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
    setNavigationMode("directions");
  }, []);

  const handleBackFromDirections = useCallback(() => {
    setNavigationMode("browse");
    setShouldDisplayRoutes(false);
  }, []);

  return (
    <View style={styles.container}>
      <BuildingSelection
        mode={navigationMode}
        selectedBuilding={selectedBuilding}
        currentBuildingCodes={inBuildingCodes}
        onSelect={(building, type) => {
          if (type === "start") setShouldDisplayRoutes(false);
          const newBuilding = selectBuildingByCode(building.buildingCode);
          if (newBuilding) focusBuilding(newBuilding);
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
          }
        }}
        renderCluster={renderCluster}
      >
        {renderedPolygons}
        {renderedMarkers}
      </MapViewCluster>

      <LocationButton
        state={locationState}
        onPress={() => {
          if (locationState === "on") centerLocation();
          else if (locationState === "off") requestLocation();
        }}
      />
      <LocationModal visible={modalOpen} onRequestClose={() => setModalOpen(false)} />
      
      {navigationMode === "browse" && selectedBuilding && (
        <BuildingInfoPopup building={selectedBuilding} onNavigate={navigateToBuilding}/>
      )}

      {navigationMode === "directions" && (
        <RoutesInfoPopup routes={routes} isOpen={true} onRouteSelect={(route) => {
          //TODO implement onRouteSelect
          }} 
          onBack={handleBackFromDirections}/>
      )}
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
