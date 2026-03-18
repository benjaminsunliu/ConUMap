import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Coordinate, CoordinateDelta, Region } from "@/types/mapTypes";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import SwitchSelector from "react-native-switch-selector";

interface MapRefLike {
  animateToRegion: (region: Region) => void;
}

interface Props {
  mapRef: React.RefObject<MapRefLike | null>;
  viewRegion: Region;
}

enum Campus {
  Loyola = 0,
  SGW = 1,
}

const SGW_CENTER: Coordinate = {
  latitude: 45.4957849,
  longitude: -73.577225,
};

const LOY_CENTER: Coordinate = {
  latitude: 45.4578596,
  longitude: -73.6395856,
};

const DEFAULT_ZOOM: CoordinateDelta = {
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function CampusToggle({ mapRef, viewRegion }: Readonly<Props>) {
  const colorScheme = useColorScheme();
  const [switchValue, setSwitchValue] = React.useState<number>(() => {
    const sgwDistance = Math.hypot(
      viewRegion.latitude - SGW_CENTER.latitude,
      viewRegion.longitude - SGW_CENTER.longitude,
    );
    const loyDistance = Math.hypot(
      viewRegion.latitude - LOY_CENTER.latitude,
      viewRegion.longitude - LOY_CENTER.longitude,
    );
    return sgwDistance < loyDistance ? Campus.SGW : Campus.Loyola;
  });

  useEffect(() => {
    const sgwDistance = Math.hypot(
      viewRegion.latitude - SGW_CENTER.latitude,
      viewRegion.longitude - SGW_CENTER.longitude,
    );
    const loyDistance = Math.hypot(
      viewRegion.latitude - LOY_CENTER.latitude,
      viewRegion.longitude - LOY_CENTER.longitude,
    );
    const newSwitchValue = sgwDistance < loyDistance ? Campus.SGW : Campus.Loyola;

    if (newSwitchValue !== switchValue) {
      setSwitchValue(newSwitchValue);
    }
  }, [viewRegion, switchValue]);

  const focusCampusOnPress = (value: number) => {
    const newFocus: Coordinate = value === Campus.SGW ? SGW_CENTER : LOY_CENTER;

    mapRef.current?.animateToRegion({
      ...newFocus,
      ...DEFAULT_ZOOM,
    });
  };

  return (
    <View style={styles.container}>
      <SwitchSelector
        initial={switchValue === Campus.Loyola ? Campus.Loyola : Campus.SGW}
        value={switchValue}
        textColor={Colors[colorScheme].campusToggle.textColor}
        selectedColor={Colors[colorScheme].campusToggle.selectedColor}
        buttonColor={Colors[colorScheme].campusToggle.buttonColor}
        borderColor={Colors[colorScheme].campusToggle.borderColor}
        backgroundColor={Colors[colorScheme].campusToggle.backgroundColor}
        disableValueChangeOnPress={false}
        bold={true}
        fontSize={20}
        borderRadius={10}
        hasPadding
        options={[
          { label: "LOY", value: Campus.Loyola },
          { label: "SGW", value: Campus.SGW },
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
    alignItems: "center",
    width: "80%",
    maxWidth: 100,
    borderRadius: 30,
    top: "90%",
    left: "2%",
    backgroundColor: "transparent",
    position: "absolute",
    zIndex: 5,
  },
});
