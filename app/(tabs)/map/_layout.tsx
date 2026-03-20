import { Stack } from "expo-router";

export default function MapTabLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[buildingCode]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
