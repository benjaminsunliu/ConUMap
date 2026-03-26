import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";

interface MapSettingsProps {
  wheelchairOnly: boolean;
  setWheelchairOnly: (val: boolean) => void;

  poiFilters: {
    bathrooms: boolean;
    elevators: boolean;
    washrooms: boolean;
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
      icon: "water-outline",
    },
    {
      key: "elevators",
      label: "Elevators",
      icon: "business-outline",
    },
    {
      key: "washrooms",
      label: "Washrooms",
      icon: "body-outline",
    },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.8}
      >
        <Ionicons name="settings-outline" size={22} color={theme.mapSettings.fabIcon} />
      </TouchableOpacity>

      {open && (
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

          <Text style={styles.sectionTitle}> Points of Interest </Text>

          {pois.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.checkboxRow}
              onPress={() => togglePOI(item.key as keyof typeof poiFilters)}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={theme.mapSettings.icon}
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
      )}
    </View>
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

    fab: {
      backgroundColor: theme.mapSettings.fabBackground,
      padding: 12,
      borderRadius: 30,
      elevation: 6,
    },

    panel: {
      marginTop: 10,
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
  });
