import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, View } from "react-native";

export interface LocationButtonProps {
  state: "on" | "off" | "centered";
  onPress: () => void;
  position?: {
    bottom: number;
    right: number;
  };
}

export default function LocationButton({
  state,
  onPress,
  position = { bottom: 40, right: 20 },
}: LocationButtonProps) {
  const icon = iconFromButtonState(state);
  return (
    <View
      style={[
        styles.container,
        { bottom: position.bottom, right: position.right },
      ]}
    >
      <Pressable onPress={onPress}>{icon}</Pressable>
    </View>
  );
}

function iconFromButtonState(state: LocationButtonProps["state"]) {
  if (state == "off") {
    return (
      <MaterialIcons
        name="explore-off"
        size={styles.icon.width}
        color="black"
      />
    );
  }
  if (state == "centered") {
    return (
      <MaterialIcons
        name="my-location"
        size={styles.icon.width}
        color="black"
      />
    );
  }
  if (state == "on") {
    return (
      <MaterialIcons
        name="location-searching"
        size={styles.icon.width}
        color="black"
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 5,
  },
  icon: {
    width: 40,
  },
});
