import darkIcon from "@/assets/logo/logo-dark.png";
import lightIcon from "@/assets/logo/logo-light.png";
import TabHeader from "@/components/ui/TabHeader";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";

export default function MapTabLayout() {
  const colorScheme = useColorScheme();
  const logos = {
    light: lightIcon,
    dark: darkIcon,
  };

  const logoSource = logos[colorScheme];
  return (
    <Stack
      screenOptions={{
        header: (a) => (
          <TabHeader
            backgroundColor={Colors[colorScheme].background}
            logoSource={logoSource}
            showBackButton={a.back !== undefined}
          />
        ),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[buildingCode]" />
    </Stack>
  );
}
