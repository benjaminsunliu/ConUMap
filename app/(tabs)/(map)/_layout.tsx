import IndoorMapHeader from "@/components/ui/indoor-map-header";
import { Stack } from "expo-router";

export default function MapTabLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[buildingCode]"
        options={{
          header: () => {
            return <IndoorMapHeader />;
          },
        }}
      />
    </Stack>
  );
}
