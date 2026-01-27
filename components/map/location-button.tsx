import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, View } from "react-native";

export interface LocationButtonProps {
  state: "on" | "off" | "centered";
  onPress: () => void;
}

export default function LocationButton({
  state,
  onPress,
}: LocationButtonProps) {
  let icon = null;
  switch (state) {
    case "off":
      icon = (
        <MaterialIcons
          name="explore-off"
          size={styles.icon.width}
          color="black"
        />
      );
      break;
    case "centered":
      icon = (
        <MaterialIcons
          name="my-location"
          size={styles.icon.width}
          color="black"
        />
      );
      break;
    case "on":
      icon = (
        <MaterialIcons
          name="location-searching"
          size={styles.icon.width}
          color="black"
        />
      );
  }
  return (
    <View style={styles.container}>
      <Pressable onPress={onPress}>{icon}</Pressable>
    </View>
  );
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
