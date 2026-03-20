import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabHeaderProps {
  readonly backgroundColor: string;
  readonly logoSource: number;
}

export default function TabHeader({ backgroundColor, logoSource }: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { backgroundColor, paddingTop: insets.top }]}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: {
    width: 120,
    height: 40,
  },
});
