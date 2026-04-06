import darkIcon from "@/assets/logo/logo-dark.png";
import lightIcon from "@/assets/logo/logo-light.png";
import { HapticTab } from "@/components/haptic-tab";
import TabHeader from "@/components/ui/TabHeader";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export const unstable_settings = {
  initialRouteName: "(map)",
};

function MapTabIcon({ color }: { readonly color: string }) {
  return <Feather name="map" size={Platform.OS === "web" ? 27 : 24} color={color} />;
}

function CalendarTabIcon({ color }: { readonly color: string }) {
  return <Feather name="calendar" size={Platform.OS === "web" ? 27 : 24} color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isWeb = Platform.OS === "web";
  const logos = {
    light: lightIcon,
    dark: darkIcon,
  };

  const logoSource = logos[colorScheme];

  return (
    <Tabs
      initialRouteName="(map)"
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme].background,
          height: isWeb ? 82 : undefined,
        },
        headerTitleAlign: "center",
        headerTitleContainerStyle: {
          paddingVertical: isWeb ? 8 : 0,
        },
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].text,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopWidth: 0,
          elevation: 5,
          height: isWeb ? 76 : undefined,
          paddingTop: isWeb ? 8 : undefined,
          paddingBottom: isWeb ? 10 : undefined,
        },
        tabBarLabelStyle: {
          fontSize: isWeb ? 15 : 12,
          paddingBottom: isWeb ? 2 : 0,
        },
        headerTitle: () => (
          <TabHeader
            backgroundColor={Colors[colorScheme].background}
            logoSource={logoSource}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="(map)"
        options={{
          title: "Map",
          tabBarIcon: MapTabIcon,
          tabBarButtonTestID: "tab-map",
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: CalendarTabIcon,
          tabBarButtonTestID: "tab-calendar",
        }}
      />
    </Tabs>
  );
}
