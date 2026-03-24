import { Image, StyleSheet, View } from "react-native";

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
