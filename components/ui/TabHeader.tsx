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
  showBackButton,
  backButtonColor,
}: Readonly<TabHeaderProps>) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { backgroundColor, paddingTop: insets.top }]}>
      {showBackButton ? (
        <Ionicons
          name="chevron-back"
          style={(styles.backButton, { color: backButtonColor })}
          onPress={() => {
            router.back();
          }}
        />
      ) : null}
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    paddingBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: {
    width: 120,
    height: 40,
  },
  backButton: {
    fontSize: 20,
  },
});
