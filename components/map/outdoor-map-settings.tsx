import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { MIN_RADIUS_METERS, MAX_RADIUS_METERS } from "@/constants/campusCenters";
import React, { useState, useEffect } from "react";
import { Platform, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";

interface OutdoorMapSettingsProps {
  radius: number;
  setRadius: (val: number) => void;
  poiFilters: {
    restaurant: boolean;
    cafe: boolean;
    library: boolean;
    gym: boolean;
    park: boolean;
    shopping_mall: boolean;
    supermarket: boolean;
  };
  setPoiFilters: (filters: OutdoorMapSettingsProps["poiFilters"]) => void;
  hasVisiblePopup?: boolean;
  searchFieldFocused?: boolean;
}

export default function OutdoorMapSettings({
  radius,
  setRadius,
  poiFilters,
  setPoiFilters,
  hasVisiblePopup = false,
  searchFieldFocused = false,
}: Readonly<OutdoorMapSettingsProps>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isMobileWeb =
    Platform.OS === "web" && typeof window !== "undefined" && window.innerWidth <= 768;
  const styles = makeStyles(theme, isMobileWeb);

  const [open, setOpen] = useState(false);
  const [displayRadius, setDisplayRadius] = useState(radius);

  useEffect(() => {
    setDisplayRadius(radius);
  }, [radius]);

  const togglePOIType = (key: keyof OutdoorMapSettingsProps["poiFilters"]) => {
    setPoiFilters({
      ...poiFilters,
      [key]: !poiFilters[key],
    });
  };

  const poiTypeItems: {
    key: keyof OutdoorMapSettingsProps["poiFilters"];
    label: string;
    icon:
    | "restaurant-outline"
    | "cafe-outline"
    | "library-outline"
    | "barbell-outline"
    | "leaf-outline"
    | "cart-outline";
  }[] = [
      { key: "restaurant", label: "Restaurants", icon: "restaurant-outline" },
      { key: "cafe", label: "Cafes", icon: "cafe-outline" },
      { key: "library", label: "Libraries", icon: "library-outline" },
      { key: "gym", label: "Gyms", icon: "barbell-outline" },
      { key: "park", label: "Parks", icon: "leaf-outline" },
      { key: "shopping_mall", label: "Malls", icon: "cart-outline" },
      { key: "supermarket", label: "Supermarkets", icon: "cart-outline" },
    ];

  if (hasVisiblePopup || searchFieldFocused) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          testID="outdoor-settings-button"
          style={[
            styles.fab,
            open
              ? {
                backgroundColor: theme.mapSettings.icon,
                borderColor: theme.mapSettings.icon,
              }
              : null,
          ]}
          onPress={() => setOpen((prev) => !prev)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="POI filters"
          accessibilityHint="Opens point of interest and radius settings"
        >
          <Ionicons
            name="pin"
            size={18}
            color={open ? theme.mapSettings.panelBackground : theme.mapSettings.fabIcon}
          />
          <Text
            style={[
              styles.fabLabel,
              {
                color: open
                  ? theme.mapSettings.panelBackground
                  : theme.mapSettings.fabIcon,
              },
            ]}
          >
            POIs
          </Text>
        </TouchableOpacity>
      </View>

      {open && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.panel} testID="outdoor-settings-panel">
            <Text style={styles.title}>POI Settings</Text>

            <View style={styles.rangeContainer}>
              <View style={styles.rangeHeader}>
                <Ionicons name="radio-outline" size={18} color={theme.mapSettings.icon} />
                <Text style={styles.label}> Search Radius </Text>
                <Text style={[styles.radiusValue, { color: theme.mapSettings.text }]}>
                  {displayRadius} m
                </Text>
              </View>

              <Slider
                testID="radius-slider"
                style={styles.slider}
                value={displayRadius}
                minimumValue={MIN_RADIUS_METERS}
                maximumValue={MAX_RADIUS_METERS}
                step={10}
                onValueChange={setDisplayRadius}
                onSlidingComplete={(value) => {
                  const rounded = Math.round(value);
                  setDisplayRadius(rounded);
                  setRadius(rounded);
                }}
              />

              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: theme.mapSettings.text }]}>
                  {MIN_RADIUS_METERS} m
                </Text>
                <Text style={[styles.sliderLabel, { color: theme.mapSettings.text }]}>
                  {MAX_RADIUS_METERS} m
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}> POI Types </Text>

            {poiTypeItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.checkboxRow}
                onPress={() => togglePOIType(item.key)}
              >
                <Ionicons name={item.icon} size={18} color={theme.mapSettings.icon} />

                <Text style={styles.label}> {item.label} </Text>

                <Ionicons
                  name={poiFilters[item.key] ? "checkbox" : "square-outline"}
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

const makeStyles = (
  theme: typeof Colors.light | typeof Colors.dark,
  isMobileWeb: boolean,
) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: isMobileWeb ? "12%" : "10%",
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
      minHeight: 42,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: theme.mapSettings.icon,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      elevation: 6,
      marginTop: 4,
      ...(Platform.OS === "web"
        ? { boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.18)" }
        : {
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.18,
          shadowRadius: 8,
        }),
    },

    fabLabel: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.2,
    },

    panel: {
      marginHorizontal: 16,
      width: 240,
      backgroundColor: theme.mapSettings.panelBackground,
      borderRadius: 16,
      padding: 14,
      elevation: 6,
    },

    title: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.mapSettings.title,
      marginBottom: 12,
    },

    rangeContainer: {
      gap: 10,
    },

    rangeHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
      gap: 8,
    },

    label: {
      flex: 1,
      color: theme.mapSettings.text,
      fontWeight: "500",
    },

    radiusValue: {
      fontWeight: "600",
      minWidth: 50,
      textAlign: "right",
    },

    slider: {
      width: "100%",
      height: 40,
    },

    sliderLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },

    sliderLabel: {
      fontSize: 12,
      fontWeight: "500",
    },

    divider: {
      height: 1,
      backgroundColor: theme.mapSettings.divider,
      marginVertical: 10,
    },

    sectionTitle: {
      marginBottom: 6,
      fontWeight: "600",
      color: theme.mapSettings.title,
    },

    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 7,
    },
  });
