import React, { useRef, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapViewCluster from "react-native-map-clustering";
import MapView, { Marker, Polygon, Region } from "react-native-maps";
import * as LocationPermissions from "expo-location";
import { CAMPUS_LOCATIONS } from "@/constants/mapData";
import { concordiaBuildings } from "@/data/parsedBuildings";
import { Coordinate, CoordinateDelta, Building as MapBuilding } from "@/types/mapTypes";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";
import BuildingInfoPopup from "./building-info-popup";
import CampusToggle from "./campus-toggle";

interface Props {
  userLocationDelta?: CoordinateDelta;
  initialRegion?: Region;
  polygonFillColor?: string;
  polygonHighlightedColor?: string;
  polygonStrokeColor?: string;
}

export default function MapViewer({
  userLocationDelta = defaultFocusDelta,
  initialRegion = defaultInitialRegion,
  polygonFillColor = "#a0686d",
  polygonHighlightedColor = "#701922",
  polygonStrokeColor = "black",
}: Props) {
  const mapViewRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] =
    useState<LocationButtonProps["state"]>("off");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);


  //TODO FIX
  const childRegionSetter = useRef<Function | null>(null);
  const onToggleMount = (regionSetter: Function) => {
    childRegionSetter.current = regionSetter;
  };



  const requestLocation = async () => {
    if (userLocation) return;

    const enabled = await LocationPermissions.hasServicesEnabledAsync();
    if (!enabled) {
      setModalOpen(true);
      return;
    }

    const { status } =
      await LocationPermissions.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await LocationPermissions.getCurrentPositionAsync();
    setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    setLocationState("on");
  };

  const centerLocation = () => {
    if (!userLocation) return;

    setLocationState("centered");
    mapViewRef.current?.animateToRegion({
      ...userLocation,
      ...userLocationDelta,
    });
  };

  const focusBuilding = (building: MapBuilding) => {
    mapViewRef.current?.animateToRegion({
      latitude: building.location.latitude,
      longitude: building.location.longitude,
      latitudeDelta: 0.001,
      longitudeDelta: 0.001,
    });
  };

  return (
    <View style={styles.container}>
      <CampusToggle initialRegion={initialRegion} mapRef={mapViewRef} onMount={onToggleMount} />
      <MapViewCluster
        ref={mapViewRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={!!userLocation}
        followsUserLocation={locationState === "centered"}
        onPress={() => setSelectedBuilding(null)}
        spiralEnabled={false}

        onRegionChange={region => {childRegionSetter.current?.(region)}}

        renderCluster={(cluster) => {
          const { id, geometry, properties } = cluster;
          const count = properties.point_count;

          return (
            <Marker
              key={`cluster-${id}`}
              coordinate={{ latitude: geometry.coordinates[1], longitude: geometry.coordinates[0] }}
              onPress={cluster.onPress}>
              <View style={styles.clusterMarker}>
                <Text style={styles.clusterText}> {count > 9 ? "9+" : count} </Text>
              </View>
            </Marker>
          );
        }}
      >
        {CAMPUS_LOCATIONS.map((building) =>
          building.polygons.map((polygon, index) => (
            <Polygon
              key={`${building.code}-${index}`}
              coordinates={polygon}
              tappable
              fillColor={
                selectedBuilding?.buildingCode === building.code
                  ? polygonHighlightedColor
                  : polygonFillColor
              }
              strokeColor={polygonStrokeColor}
              onPress={() => {
                const info = concordiaBuildings.find(
                  (b) => b.buildingCode === building.code
                );
                setSelectedBuilding(info ?? null);
                focusBuilding(building);
              }}
            />
          ))
        )}

        {CAMPUS_LOCATIONS.map((building) => {
          const isSelected = selectedBuilding?.buildingCode === building.code;

          return (
            <Marker
              key={building.code}
              coordinate={building.location}
              onPress={() => {
                const info = concordiaBuildings.find(
                  (b) => b.buildingCode === building.code
                );
                setSelectedBuilding(info ?? null);
                focusBuilding(building);
              }}
            >
              <View style={[styles.marker, isSelected && styles.markerSelected]}>
                <Text style={[styles.markerText, isSelected && styles.markerTextSelected]}>
                  {building.code}
                </Text>
              </View>
            </Marker>
          );
        })}
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
  container: {
    flex: 1
  },
  map: {
    width: "100%",
    height: "100%"
  },
  marker: {
    backgroundColor: "#200003",
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff"
  },
  markerSelected: {
    backgroundColor: "#fff",
    borderColor: "#200003"
  },
  markerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  markerTextSelected: {
    color: "#701922",
  },

  clusterMarker: {
    backgroundColor: "#701922",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
  },
  clusterText: {
    color: "#fff",
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
