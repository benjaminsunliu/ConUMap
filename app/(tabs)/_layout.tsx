import { Tabs } from "expo-router";
import React from "react";
import { View, Image, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Feather from "@expo/vector-icons/Feather";

interface TabHeaderProps {
  readonly backgroundColor: string;
  readonly logoSource: number;
}

function TabHeader({ backgroundColor, logoSource }: TabHeaderProps) {
  return (
    <View style={[styles.header, { backgroundColor }]}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

function MapTabIcon({ color }: { readonly color: string }) {
  return <Feather name="map" size={24} color={color} />;
}

function HomeTabIcon({ color }: { readonly color: string }) {
  return <IconSymbol size={28} name="house.fill" color={color} />;
}

function CalendarTabIcon({ color }: { readonly color: string }) {
  return <Feather name="calendar" size={24} color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const logos = {
    light: require("@/assets/logo/logo-light.png"),
    dark: require("@/assets/logo/logo-dark.png"),
  };

  const logoSource = logos[colorScheme];

  return (
    <Tabs
      screenOptions={{
        header: () => (
          <TabHeader
            backgroundColor={Colors[colorScheme].background}
            logoSource={logoSource}
          />
        ),
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].text,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopWidth: 0,
          elevation: 5,
        },
      }}
    >
      <Tabs.Screen
        name="map-tab"
        options={{
          title: "Map",
          tabBarIcon: MapTabIcon,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: HomeTabIcon,
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

const styles = StyleSheet.create({
  header: {
    marginTop: "8%",
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  logo: {
    width: 120,
    height: 40,
  },
});
