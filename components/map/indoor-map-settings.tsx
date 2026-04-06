import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch, Image } from "react-native";

interface MapSettingsProps {
  wheelchairOnly: boolean;
  setWheelchairOnly: (val: boolean) => void;

  poiFilters: {
    bathrooms: boolean;
    elevators: boolean;
    waterFountains: boolean;
    stairs: boolean;
    escalators: boolean;
  };
  setPoiFilters: (filters: MapSettingsProps["poiFilters"]) => void;
}

export default function MapSettings({
  wheelchairOnly,
  setWheelchairOnly,
  poiFilters,
  setPoiFilters,
}: Readonly<MapSettingsProps>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = makeStyles(theme);

  const [open, setOpen] = useState(false);

  const togglePOI = (key: keyof typeof poiFilters) => {
    setPoiFilters({
      ...poiFilters,
      [key]: !poiFilters[key],
    });
  };

  const pois = [
    {
      key: "bathrooms",
      label: "Bathrooms",
      iconSource: require("@/assets/icons/bathroom.png"),
    },
    {
      key: "elevators",
      label: "Elevators",
      iconSource: require("@/assets/icons/elevator.png"),
    },
    {
      key: "waterFountains",
      label: "Water Fountains",
      iconSource: require("@/assets/icons/water_fountain.png"),
    },
    {
      key: "stairs",
      label: "Stairs",
      iconSource: require("@/assets/icons/stairway.png"),
    },
    {
      key: "escalators",
      label: "Escalators",
      iconSource: require("@/assets/icons/escalator.png"),
    },
  ];

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          testID="SettingsButton"
          style={styles.fab}
          onPress={() => setOpen((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={18} color={theme.mapSettings.fabIcon} />
        </TouchableOpacity>
      </View>

      {open && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.panel}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.row}>
              <Ionicons
                name="accessibility-outline"
                size={18}
                color={theme.mapSettings.icon}
              />
              <Text style={styles.label}> Wheelchair Accessible </Text>
              <Switch
                value={wheelchairOnly}
                onValueChange={setWheelchairOnly}
                thumbColor={
                  wheelchairOnly
                    ? theme.mapSettings.toggleTrue
                    : theme.mapSettings.toggleFalse
                }
                trackColor={{
                  true: theme.mapSettings.toggleTrue,
                  false: theme.mapSettings.toggleFalse,
                }}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Highlight Points of Interest </Text>

            {pois.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.checkboxRow}
                onPress={() => togglePOI(item.key as keyof typeof poiFilters)}
                testID={`poi-settings-checkbox-${item.key}`}
              >
                <Image
                  source={item.iconSource}
                  style={[
                    styles.poiIcon,
                    item.key === "elevators" ? styles.elevatorPoiIcon : null,
                  ]}
                  resizeMode="contain"
                  testID={`poi-settings-icon-${item.key}`}
                />

                <Text style={styles.label}> {item.label} </Text>

                <Ionicons
                  name={
                    poiFilters[item.key as keyof typeof poiFilters]
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={20}
                  color={theme.mapSettings.checkbox}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

const makeStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: "7%",
      right: 16,
      zIndex: 20,
      alignItems: "flex-end",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.mapSettings.backdropColor,
    },

    fab: {
      backgroundColor: theme.mapSettings.fabBackground,
      padding: 8,
      borderRadius: 30,
      elevation: 6,
    },

    panel: {
      marginHorizontal: 16,
      width: 220,
      backgroundColor: theme.mapSettings.panelBackground,
      borderRadius: 16,
      padding: 14,
      elevation: 8,
    },

    title: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.mapSettings.title,
      marginBottom: 10,
    },

    sectionTitle: {
      marginTop: 6,
      marginBottom: 6,
      fontWeight: "600",
      color: theme.mapSettings.title,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: 6,
      gap: 8,
    },

    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },

    label: {
      flex: 1,
      marginLeft: 8,
      color: theme.mapSettings.text,
    },

    divider: {
      height: 1,
      backgroundColor: theme.mapSettings.divider,
      marginVertical: 8,
    },

    poiIcon: {
      width: 18,
      height: 18,
    },

    elevatorPoiIcon: {
      width: 26,
      height: 26,
      marginLeft: -6,
    },
  });
