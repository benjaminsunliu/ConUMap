import { Tabs } from "expo-router";
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Feather from "@expo/vector-icons/Feather";

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <Tabs
      screenOptions={{
        header: () => (
          <View style={[styles.header, { backgroundColor: Colors[colorScheme].background }]}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            {/* <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>ConU Map</Text> */}
          </View>
        ),
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].text,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].background,
          borderTopWidth: 0,
          elevation: 5,
        }
      }}
    >
      <Tabs.Screen
        name="map-tab"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <Feather name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => <Feather name="calendar" size={24} color={color} />,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  }
});
