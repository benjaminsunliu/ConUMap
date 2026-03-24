import AuthContextProvider from "@/components/authentication/AuthContextProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "@/hooks/query";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const headerTintColor = Colors[colorScheme].background;
  return (
    <AuthContextProvider>
      <GestureHandlerRootView>
        <QueryClientProvider client={queryClient}>
          <Stack>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false, headerTintColor }}
            />
          </Stack>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </AuthContextProvider>
  );
}
