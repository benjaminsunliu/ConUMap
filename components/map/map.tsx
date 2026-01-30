import { CAMPUS_LOCATIONS } from "@/constants/mapData";
import { Coordinate } from "@/types/map";
import * as LocationPermissions from "expo-location";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Building, buildings } from "../../data/building-info-data";
import BuildingInfoCard from "./building-info-card";
import MapView, { MapPressEvent, Marker, Polygon } from "react-native-maps";
import LocationButton, { LocationButtonProps } from "./location-button";
import LocationModal from "./location-modal";

interface Props {
  focusDelta?: CoordinateDelta;
  initialRegion?: Region;
}

type Location = {
  latitude: number;
  longitude: number;
};

export default function Map({
  focusDelta = { latitudeDelta: 0.00922, longitudeDelta: 0.00421 },
  initialRegion,
}: Props) {
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] =
    useState<LocationButtonProps["state"]>("off");

  const [selectedBuilding, setSelectedBuilding] =
    useState<Building | null>(null);
    
  const [modalOpen, setModalOpen] = useState(false);

  const mapViewRef = useRef<MapView>(null);

  const askLocationPermission = async () => {
    if (userLocation) {
      return false;
    }
    const locationEnabled = await LocationPermissions.hasServicesEnabledAsync();
    if (!locationEnabled) {
      setModalOpen(true);
      return false;
    }
    const { status } =
      await LocationPermissions.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Location wasn't grandted");
      return false;
    }
    const location = await LocationPermissions.getCurrentPositionAsync();
    console.log("Go the current location manually");
    console.log(location);
    setUserLocation({
      longitude: location.coords.latitude,
      latitude: location.coords.latitude,
    });
    setLocationState("on");
    return true;
  };

  const centerLocation = () => {
    console.log("centering location");
    if (!userLocation) {
      console.log("can't center the location since there is no location");
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
    setSelectedBuilding(null)
    const coordinates = event.nativeEvent.coordinate;
    console.log(coordinates);
  };

  const bannex = CAMPUS_LOCATIONS[0];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        initialRegion={initialRegion || defaultInitialRegion}
        showsUserLocation={userLocation !== null}
        followsUserLocation={locationState === "centered"}
        onPress={onMapPress}
        onPanDrag={() => {
          if (userLocation) {
            setLocationState("on");
          }
        }}
        onUserLocationChange={({ nativeEvent: { coordinate } }) => {
          console.log("Location changed");
          if (!coordinate) {
            return;
          }
          if (!userLocation) {
            setLocationState("on");
          }
          setUserLocation(coordinate);
        }}
      >
        {CAMPUS_LOCATIONS.map((building) => {
          if (building.type === "point") {
            return <Marker coordinate={building.location} key={building.code} />;
          } else {
            return building.polygon.map((polygon, i) => (
              <Polygon
                key={building.code + i}
                fillColor="rgba(255,0,0,0.5)"
                coordinates={polygon}
              />
            ));
          }
        })}
        {buildings.map((building) => (
        <Marker
          key={building.id}
          coordinate={{
            latitude: building.latitude,
            longitude: building.longitude,
          }}
          onPress={() => setSelectedBuilding(building)}
        />
        ))}
      </MapView>
      <BuildingInfoCard building={selectedBuilding} />
      <LocationButton
        state={locationState}
        onPress={async () => {
          if (locationState === "on") {
            centerLocation();
          } else if (locationState === "off") {
            await askLocationPermission();
          }
        }}
      />
      <LocationModal
        onRequestClose={() => setModalOpen(false)}
        visible={modalOpen}
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

type CoordinateDelta = {
  latitudeDelta: number;
  longitudeDelta: number;
};

type Region = Coordinate & CoordinateDelta;

const defaultInitialRegion: Region = {
  latitude: 45.49575,
  longitude: -73.5793055556,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0922,
};
