import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface IndoorNavigationControlsProps {
  instruction: string;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}

export default function IndoorNavigationControls({
  instruction,
  onNext,
  onPrevious,
  canGoNext = true,
  canGoPrevious = true,
}: IndoorNavigationControlsProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.sideButton, !canGoPrevious && styles.disabled]}
        onPress={onPrevious}
        disabled={!canGoPrevious}
      >
        <Ionicons name="arrow-back" size={22} color={theme.mapSettings.fabIcon} />
        <Text style={styles.sideText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.centerCard}>
        <Text style={styles.instructionText}> {instruction} </Text>
        <Ionicons
          name="arrow-up"
          size={20}
          color={theme.mapSettings.icon}
          style={{ marginTop: 4 }}
        />
      </View>

      <TouchableOpacity
        style={[styles.sideButton, !canGoNext && styles.disabled]}
        onPress={onNext}
        disabled={!canGoNext}
      >
        <Text style={styles.sideText}>Next</Text>
        <Ionicons name="arrow-forward" size={22} color={theme.mapSettings.fabIcon} />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 30,
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 20,
    },
    sideButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.mapSettings.fabBackground,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 25,
      gap: 6,
      elevation: 5,
    },
    sideText: {
      color: theme.mapSettings.fabIcon,
      fontWeight: "600",
    },
    disabled: {
      opacity: 0.4,
    },
    centerCard: {
      flex: 1,
      marginHorizontal: 10,
      backgroundColor: theme.mapSettings.panelBackground,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 16,
      alignItems: "center",
      elevation: 6,
    },
    instructionText: {
      color: theme.mapSettings.text,
      textAlign: "center",
      fontWeight: "500",
      fontSize: 14,
    },
  });
