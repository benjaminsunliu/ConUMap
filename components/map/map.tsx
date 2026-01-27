import * as LocationPermissions from "expo-location";
import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";
import LocationButton, { LocationButtonProps } from "./location-button";

interface Props {
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export default function Map({
  latitudeDelta = 0.00922,
  longitudeDelta = 0.00421,
}: Props) {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationState, setLocationState] =
    useState<LocationButtonProps["state"]>("off");
  const mapViewRef = useRef<MapView>(null);

  const askLocationPermission = async () => {
    if (location) {
      return false;
    }
    const { status } =
      await LocationPermissions.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return false;
    }
    centerLocation();
    return true;
  };

  const centerLocation = () => {
    if (!location) {
      return;
    }
    setLocationState("centered");
    const region = { ...location, latitudeDelta, longitudeDelta };
    mapViewRef.current?.animateToRegion(region);
  };

  const initialRegion = {
    latitude: 45.49575,
    longitude: -73.5793055556,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0922,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        followsUserLocation={locationState === "centered"}
        onPanDrag={() => {
          if (location) {
            setLocationState("on");
          }
        }}
        onUserLocationChange={({ nativeEvent: { coordinate } }) => {
          if (coordinate) {
            setLocation(coordinate);
          }
          if (!location) {
            setLocationState("on");
          }
        }}
      />
      <LocationButton
        state={locationState}
        onPress={async () => {
          if (locationState === "on") {
            centerLocation();
          } else if (locationState === "off") {
            askLocationPermission();
          }
        }}
      />
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
  locationButton: {
    position: "absolute",
    bottom: 1,
    right: 1,
  },
});

type Location = {
  latitude: number;
  longitude: number;
};
