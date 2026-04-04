import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface IndoorNavigationControlsProps {
  onNext: () => void;
  onPrevious: () => void;
  currentFloor: number;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  mode?: "floor" | "step";
  currentStep?: number;
  totalSteps?: number;
  stepInstruction?: string;
}

export default function IndoorNavigationControls({
  onNext,
  onPrevious,
  currentFloor,
  canGoNext = true,
  canGoPrevious = true,
  mode = "floor",
  currentStep = 1,
  totalSteps = 1,
  stepInstruction,
}: Readonly<IndoorNavigationControlsProps>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = makeStyles(theme);
  const formatFloor = (floor: number) => {
    if (floor < 0) return `B${Math.abs(floor)}`;
    return `${floor}`;
  };
  const isStepMode = mode === "step";
  const centerText = isStepMode
    ? `Step ${currentStep} of ${totalSteps}`
    : `Floor ${formatFloor(currentFloor)}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID="prev-step"
        style={[styles.sideButton, !canGoPrevious && styles.disabled]}
        onPress={onPrevious}
        disabled={!canGoPrevious}
      >
        <Ionicons name="arrow-back" size={18} color={theme.mapSettings.fabIcon} />
        <Text style={styles.sideText}>{isStepMode ? "Prev Step" : "Prev Floor"}</Text>
      </TouchableOpacity>

      <View style={styles.centerCard}>
        <Text style={styles.instructionText}>{centerText}</Text>
        {isStepMode && stepInstruction ? (
          <Text style={styles.stepInstructionText} numberOfLines={4}>
            {stepInstruction}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        testID="next-button"
        style={[styles.sideButton, !canGoNext && styles.disabled]}
        onPress={onNext}
        disabled={!canGoNext}
      >
        <Text style={styles.sideText}>{isStepMode ? "Next Step" : "Next Floor"}</Text>
        <Ionicons name="arrow-forward" size={18} color={theme.mapSettings.fabIcon} />
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
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 4,
      elevation: 5,
    },
    sideText: {
      color: theme.mapSettings.fabIcon,
      fontWeight: "600",
      fontSize: 12,
    },
    disabled: {
      opacity: 0.4,
    },
    centerCard: {
      flex: 1,
      marginHorizontal: 6,
      backgroundColor: theme.mapSettings.panelBackground,
      paddingVertical: 10,
      paddingHorizontal: 12,
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
    stepInstructionText: {
      marginTop: 4,
      color: theme.mapSettings.text,
      textAlign: "center",
      fontSize: 13,
      lineHeight: 18,
    },
  });
