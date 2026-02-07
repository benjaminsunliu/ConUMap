import { CAMPUS_LOCATIONS } from "@/constants/mapData";
import { Coordinate, CoordinateDelta } from "@/types/mapTypes";
import * as LocationPermissions from "expo-location";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Polygon, Region } from "react-native-maps";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";

interface Props {
  userLocationDelta?: CoordinateDelta;
  initialRegion?: Region;
  polygonFillColor?: string;
  polygonStrokeColor?: string;
}

export default function MapViewer({
  userLocationDelta = defaultFocusDelta,
  initialRegion = defaultInitialRegion,
  polygonFillColor = "rgba(255,0,0,0.5)",
  polygonStrokeColor = "black",
}: Props) {
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationButtonProps["state"]>("off");
  const [modalOpen, setModalOpen] = useState(false);
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
    const region = {
      ...userLocation,
      latitudeDelta: userLocationDelta.latitudeDelta,
      longitudeDelta: userLocationDelta.longitudeDelta,
    };
    mapViewRef.current?.animateToRegion(region);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        testID="map-view"
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={userLocation !== null}
        followsUserLocation={locationState === "centered"}
        onPanDrag={() => (userLocation ? setLocationState("on") : null)}
        onUserLocationChange={({ nativeEvent: { coordinate } }) => {
          if (!coordinate) {
            return;
          }
          if (!userLocation) {
            setLocationState("on");
          }
          setUserLocation(coordinate);
        }}
      >
        {CAMPUS_LOCATIONS.map((building, i) => {
          return building.polygons.map((polygon, i) => (
            <Polygon
              key={i}
              fillColor={polygonFillColor}
              strokeColor={polygonStrokeColor}
              coordinates={polygon}
              testID="polygon"
            />
          ));
        })}
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
