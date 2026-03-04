import AuthContextProvider from "@/components/authentication/AuthContextProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import React from "react";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </AuthContextProvider>
  );
}
