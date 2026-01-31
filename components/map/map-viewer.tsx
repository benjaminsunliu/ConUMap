import { CAMPUS_LOCATIONS } from "@/constants/mapData";
import { Coordinate } from "@/types/mapTypes";
import * as LocationPermissions from "expo-location";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { MapPressEvent, Marker, Polygon } from "react-native-maps";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";

interface Props {
  focusDelta?: CoordinateDelta;
  initialRegion?: Region;
}

export default function MapViewer({
  focusDelta = defaultFocusDelta,
  initialRegion = defaultInitialRegion,
}: Props) {
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] = useState<LocationButtonProps["state"]>("off");
  const [modalOpen, setModalOpen] = useState(false);
  const mapViewRef = useRef<MapView>(null);

  const requestLocation = async () => {
    if (userLocation) {
      return false;
    }
    const locationEnabled = await LocationPermissions.hasServicesEnabledAsync();
    if (!locationEnabled) {
      setModalOpen(true);
      return false;
    }
    const { status } = await LocationPermissions.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return false;
    }
    const location = await LocationPermissions.getCurrentPositionAsync();
    setUserLocation({
      longitude: location.coords.latitude,
      latitude: location.coords.latitude,
    });
    setLocationState("on");
    return true;
  };

  const centerLocation = () => {
    if (!userLocation) {
      return;
    }
    setLocationState("centered");
    const region = {
      ...userLocation,
      latitudeDelta: focusDelta.latitudeDelta,
      longitudeDelta: focusDelta.longitudeDelta,
    };
    mapViewRef.current?.animateToRegion(region);
  };

  const onMapPress = (event: MapPressEvent) => {
    const coordinates = event.nativeEvent.coordinate;
    console.log(coordinates);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={userLocation !== null}
        followsUserLocation={locationState === "centered"}
        onPress={onMapPress}
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
          if (building.type === "point") {
            return <Marker key={i} coordinate={building.location} />;
          } else {
            return building.polygons.map((polygon, i) => (
              <Polygon key={i} fillColor="rgba(255,0,0,0.5)" coordinates={polygon} />
            ));
          }
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

type CoordinateDelta = {
  latitudeDelta: number;
  longitudeDelta: number;
};

type Region = Coordinate & CoordinateDelta;

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
