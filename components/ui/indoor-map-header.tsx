import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet } from "react-native";

export default function IndoorMapHeader() {
  const theme = useColorScheme();
  return (
    <Ionicons
      name="chevron-back"
      onPress={() => router.back()}
      style={[styles.backButton, { color: Colors[theme].text }]}
    />
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    fontSize: 20,
    padding: 20,
  },
});
