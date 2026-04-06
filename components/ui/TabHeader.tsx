import { Image, Platform, StyleSheet, View } from "react-native";

interface TabHeaderProps {
  backgroundColor: string;
  logoSource: number;
}

export default function TabHeader({
  backgroundColor,
  logoSource,
}: Readonly<TabHeaderProps>) {
  return (
    <View testID="tab-header" style={[styles.header, { backgroundColor }]}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Platform.OS === "web" ? 10 : 0,
  },
  logo: {
    width: Platform.OS === "web" ? 136 : 120,
    height: Platform.OS === "web" ? 42 : 35,
  },
});
