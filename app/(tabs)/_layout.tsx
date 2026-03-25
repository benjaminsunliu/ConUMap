import darkIcon from "@/assets/logo/logo-dark.png";
import lightIcon from "@/assets/logo/logo-light.png";
import { HapticTab } from "@/components/haptic-tab";
import TabHeader from "@/components/ui/TabHeader";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import React from "react";

function MapTabIcon({ color }: { readonly color: string }) {
  return <Feather name="map" size={24} color={color} />;
}

function CalendarTabIcon({ color }: { readonly color: string }) {
  return <Feather name="calendar" size={24} color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const logos = {
    light: lightIcon,
    dark: darkIcon,
  };

  const logoSource = logos[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme].background,
        },
        headerTitleAlign: "center",
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].text,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopWidth: 0,
          elevation: 5,
        },
        headerTitle: () => {
          return (
            <TabHeader
              backgroundColor={Colors[colorScheme].background}
              logoSource={logoSource}
            />
          );
        },
      }}
    >
      <Tabs.Screen
        name="(map)"
        options={{
          title: "Map",
          tabBarIcon: MapTabIcon
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: CalendarTabIcon,
        }}
      />
    </Tabs>
  );
}
