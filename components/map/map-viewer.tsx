import { CAMPUS_LOCATIONS } from "@/constants/mapData";
import { Coordinate, CoordinateDelta, Building as MapBuilding } from "@/types/mapTypes";
import * as LocationPermissions from "expo-location";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Polygon, Region } from "react-native-maps";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";
import BuildingInfoPopup from "./building-info-popup";
import React from "react";
import { concordiaBuildings } from "@/data/parsedBuildings";

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
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationButtonProps["state"]>("off");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  const mapViewRef = useRef<MapView>(null);

  const requestLocation = async () => {
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
      longitude: location.coords.longitude,
      latitude: location.coords.latitude,
    });
    setLocationState("on");
    return;
  };

  const centerLocation = () => {
    if (!userLocation) {
      return;
    }
    setLocationState("centered");
    mapViewRef.current?.animateToRegion({
      ...userLocation,
      latitudeDelta: userLocationDelta.latitudeDelta,
      longitudeDelta: userLocationDelta.longitudeDelta,
    });
  };

  const focusBuilding = (building: MapBuilding) => {
    mapViewRef.current?.animateToRegion({
      latitude: building.location.latitude,
      longitude: building.location.longitude,
      latitudeDelta: 0.002,
      longitudeDelta: 0.002,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={userLocation !== null}
        followsUserLocation={locationState === "centered"}
        onPanDrag={() => (userLocation ? setLocationState("on") : null)}
        onPress={() => setSelectedBuilding(null)}
        onUserLocationChange={({ nativeEvent: { coordinate } }) => {
          if (!coordinate) return;
          if (!userLocation) setLocationState("on");
          setUserLocation(coordinate);
        }}
      >
        {CAMPUS_LOCATIONS.map((building) =>
          building.polygons.map((polygon, polygonIndex) => (
            <Polygon
              key={`${building.code}-${polygonIndex}`}
              coordinates={polygon}
              tappable
              fillColor={selectedBuilding?.buildingCode === building.code ? polygonHighlightedColor : polygonFillColor}
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

      </MapView>
      <LocationButton
        state={locationState}
        onPress={async () => {
          if (locationState === "on") {
            centerLocation();
          } else if (locationState === "off") {
            requestLocation();
          }
        }}
      />
      <LocationModal onRequestClose={() => setModalOpen(false)} visible={modalOpen} />
      <BuildingInfoPopup building={selectedBuilding} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
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
