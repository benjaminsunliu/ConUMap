import { Coordinate, CoordinateDelta, Region } from "@/types/mapTypes";
import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
} from "react-native";
import SwitchSelector from "react-native-switch-selector";
import MapView from "react-native-maps";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

interface Props {
  mapRef: React.RefObject<MapView | null>;
  viewRegion: Region;
}

const LOY = 0;
const SGW = 1;

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

export default function CampusToggle({ mapRef, viewRegion }: Props) {

  const colorScheme = useColorScheme() ?? "light";
  const [switchValue, setSwitchValue] = React.useState<number>(() => {
    let swgDistance = Math.hypot(viewRegion.latitude - SGW_CENTER.latitude, viewRegion.longitude - SGW_CENTER.longitude);
    let loyDistance = Math.hypot(viewRegion.latitude - LOY_CENTER.latitude, viewRegion.longitude - LOY_CENTER.longitude);
    return swgDistance < loyDistance ? SGW : LOY;
  });

  useEffect(() => {
    let swgDistance = Math.hypot(viewRegion.latitude - SGW_CENTER.latitude, viewRegion.longitude - SGW_CENTER.longitude);
    let loyDistance = Math.hypot(viewRegion.latitude - LOY_CENTER.latitude, viewRegion.longitude - LOY_CENTER.longitude);
    let newSwitchValue = swgDistance < loyDistance ? SGW : LOY;

    if (newSwitchValue !== switchValue) {
      setSwitchValue(newSwitchValue);
    }
  }, [viewRegion, switchValue]);

  const focusCampusOnPress = (value: number) => {

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
        textColor={Colors[colorScheme].campusToggle.textColor}
        selectedColor={Colors[colorScheme].campusToggle.selectedColor}
        buttonColor={Colors[colorScheme].campusToggle.buttonColor}
        borderColor={Colors[colorScheme].campusToggle.borderColor}
        backgroundColor={Colors[colorScheme].campusToggle.backgroundColor}
        disableValueChangeOnPress={true}
        bold={true}
        fontSize={20}
        
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
