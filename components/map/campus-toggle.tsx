import { Coordinate, CoordinateDelta, Region } from "@/types/mapTypes";
import React from "react";
import {
  View,
  StyleSheet,
} from "react-native";
import SwitchSelector from "react-native-switch-selector";
import MapView from "react-native-maps";

interface Props {
  initialRegion: Region;
  mapRef: React.RefObject<MapView | null>;
}

const SGW = "SGW";
const LOY = "LOY";

const SGW_CENTER: Coordinate = {
  latitude: 45.4957849,
  longitude: -73.577225
};

const LOY_CENTER: Coordinate = {
  latitude: 45.4578596,
  longitude: -73.6395856,
};

const DEFAULT_ZOOM: CoordinateDelta = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
}

const SWITCH_STYLES = {
  textColor: "#FFFFFF",
  selectedColor: "#000000",
  buttonColor: "#FFFFFF",
  borderColor: "#000000",
  backgroundColor: "#000000"
}

export default function CampusToggle({ initialRegion, mapRef }: Props) {

  const [switchValue, setSwitchValue] = React.useState<string>(LOY);
  // const [viewRegion, setViewRegion] = React.useState<Region>(initialRegion);

  // useEffect(() => {
  //   let swgDistance = Math.hypot(viewRegion.latitude - SGW_CENTER.latitude, viewRegion.longitude - SGW_CENTER.longitude);
  //   let loyDistance = Math.hypot(viewRegion.latitude - LOY_CENTER.latitude, viewRegion.longitude - LOY_CENTER.longitude);
  //   let newSwitchValue = swgDistance < loyDistance ? SGW : LOY;

  //   if (newSwitchValue !== switchValue) {
  //     setSwitchValue(newSwitchValue);
  //   }
  //   console.log("Current: " + switchValue);
  //   console.log("Recalculated: " + newSwitchValue);
  // }, [viewRegion, switchValue]);

  const focusCampusOnPress = (value: string) => {

    setSwitchValue(value);

    let newFocus: Coordinate = value === SGW ? SGW_CENTER : LOY_CENTER;

    mapRef.current?.animateToRegion({
      ...newFocus,
      ...DEFAULT_ZOOM,
    });
  };

  return (
    <View style={styles.container}>
      <SwitchSelector
        initial={switchValue === LOY ? 0 : 1}
        value={switchValue}
        textColor={SWITCH_STYLES.textColor}
        selectedColor={SWITCH_STYLES.selectedColor}
        buttonColor={SWITCH_STYLES.buttonColor}
        borderColor={SWITCH_STYLES.borderColor}
        backgroundColor={SWITCH_STYLES.backgroundColor}
        
        hasPadding
        options={[
          { label: "Loyola", value: LOY }, 
          { label: "SGW", value: SGW } 
        ]}
        testID="campus-toggle-selector"
        accessibilityLabel="campus-toggle-selector"
        onPress={focusCampusOnPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    width: "80%",
    maxWidth: 300,
    borderRadius: 30,
    top: "2%",
    left: "50%",
    transform: [{ translateX: "-50%" }],
    backgroundColor: "transparent",
    position: "absolute",
    zIndex: 10,
  },
});
