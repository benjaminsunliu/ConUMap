import darkIcon from "@/assets/logo/logo-dark.png";
import lightIcon from "@/assets/logo/logo-light.png";
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const unstable_settings = {
  initialRouteName: "map-tab",
};

interface TabHeaderProps {
  readonly backgroundColor: string;
  readonly logoSource: number;
}

function TabHeader({ backgroundColor, logoSource }: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { backgroundColor, paddingTop: insets.top }]}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

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
      initialRouteName="map-tab"
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
          tabBarButtonTestID: "tab-map",
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
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

const styles = StyleSheet.create({
  header: {
    paddingBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: {
    width: 120,
    height: 40,
  },
});
