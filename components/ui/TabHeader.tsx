import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabHeaderProps {
  backgroundColor: string;
  logoSource: number;
  showBackButton?: boolean;
  backButtonColor?: string;
}

export default function TabHeader({
  backgroundColor,
  logoSource,
}: Readonly<TabHeaderProps>) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { backgroundColor }]}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 40,
  },
});
