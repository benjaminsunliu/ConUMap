import { Colors } from "@/constants/theme";
import { BuildingInfo } from "@/types/mapTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import InfoPopup from "../ui/popup";

interface Props {
  readonly building: BuildingInfo | null;
  readonly onNavigate?: () => void;
  readonly onSetAsStart?: () => void;
}

type ActionType = "directions" | "start" | "website";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_OPENING_HOURS = [
  "7:00 AM – 11:00 PM",
  "7:00 AM – 11:00 PM",
  "7:00 AM – 11:00 PM",
  "7:00 AM – 11:00 PM",
  "7:00 AM – 11:00 PM",
  "7:00 AM – 9:00 PM",
  "7:00 AM – 9:00 PM",
];

export default function BuildingInfoPopup({ building, onNavigate, onSetAsStart }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = makeStyles(theme);

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const ACTIONS = useMemo(
    () => [
      { label: "Directions", icon: "navigate-outline", type: "directions" as const },
      { label: "Set Start", icon: "flag-outline", type: "start" as const },
      { label: "Website", icon: "globe-outline", type: "website" as const },
    ],
    [],
  );

  const handleAction = useCallback(
    async (type: "directions" | "website") => {
      const urls: Record<typeof type, string> = {
        directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(building?.address || "")}`,
        website: building?.url || "",
      };

      const url = urls[type];
      if (!url) {
        console.warn(`No URL available for action: ${type}`);
        return;
      }

      try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          console.warn(`Cannot open URL: ${url}`);
          return;
        }
        await Linking.openURL(url);
      } catch (error) {
        console.error(`Failed to open URL (${type}):`, error);
      }
    },
    [building?.address, building?.url],
  );

  const formatCamelCase = useCallback(
    (text: string) =>
      text
        .replaceAll(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, " ")
        .trim()
        .replace(/^./, (match) => match.toUpperCase()),
    [],
  );

  const getActionHandler = useCallback(
    (type: ActionType) => {
      if (type === "directions") {
        return onNavigate
          ? () => onNavigate()
          : () => {
              void handleAction("directions");
            };
      } else if (type === "start") {
        return onSetAsStart ? () => onSetAsStart() : undefined;
      } else {
        return () => {
          void handleAction("website");
        };
      }
    },
    [handleAction, onNavigate, onSetAsStart],
  );

  const header = useMemo(() => {
    return (
      <>
        <Text style={styles.title} numberOfLines={1}>
          {building?.buildingCode} – {building?.buildingName}
        </Text>

        <Text style={styles.line}>
          {building?.campus} Campus | {building?.address}
        </Text>

        <Text style={styles.openStatus}>Today: {DEFAULT_OPENING_HOURS[todayIdx]}</Text>

        <View style={styles.actionsRow}>
          {ACTIONS.map((a) => (
            <ActionButton
              key={a.type}
              {...a}
              testID={`${a.type}-action-button`}
              onPress={getActionHandler(a.type)}
              theme={theme}
            />
          ))}
        </View>
      </>
    );
  }, [
    ACTIONS,
    building,
    getActionHandler,
    styles.actionsRow,
    styles.line,
    styles.openStatus,
    styles.title,
    theme,
    todayIdx,
  ]);

  return (
    <InfoPopup shouldDisplay={!!building} header={header} testID="building-info-popup">
      {(building?.accessibility?.length || 0) > 0 && (
        <>
          <Text style={styles.sectionTitle}>Accessibility</Text>
          {building?.accessibility.map((item) => (
            <ListItem key={item} text={formatCamelCase(item)} theme={theme} />
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Opening Hours</Text>
      {DEFAULT_OPENING_HOURS.map((h, i) => (
        <Text
          key={WEEKDAYS[i]}
          style={[styles.line, i === todayIdx && styles.todayHighlight]}
        >
          {"  "}
          {WEEKDAYS[i]}: {h}
        </Text>
      ))}
    </InfoPopup>
  );
}

/* ---------- Subcomponents ---------- */

const ListItem = ({
  text,
  theme,
}: {
  readonly text: string;
  readonly theme: typeof Colors.light;
}) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
    <Ionicons
      name="checkmark-circle-outline"
      size={18}
      color={theme.buildingInfoPopup.accessibilityIcon}
      style={{ marginRight: 6 }}
    />
    <Text style={{ color: theme.buildingInfoPopup.text }}>{text}</Text>
  </View>
);

const ActionButton = ({
  label,
  icon,
  onPress,
  testID,
  theme,
}: {
  readonly label: string;
  readonly icon: string;
  readonly onPress?: () => void;
  readonly testID: string;
  readonly theme: typeof Colors.light;
}) => (
  <TouchableOpacity
    style={[
      {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: theme.buildingInfoPopup.actionButtonBackground,
      },
    ]}
    onPress={onPress}
    testID={testID}
  >
    <Ionicons
      name={icon as any}
      size={18}
      color={theme.buildingInfoPopup.actionButtonIcon}
      style={{ marginRight: 6 }}
    />
    <Text
      style={{
        color: theme.buildingInfoPopup.actionButtonText,
        fontWeight: "500",
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const makeStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    title: {
      fontSize: 22,
      fontWeight: "600",
      color: theme.buildingInfoPopup.title,
      marginBottom: 4,
    },
    line: {
      color: theme.buildingInfoPopup.text,
      marginTop: 4,
    },
    openStatus: {
      color: theme.buildingInfoPopup.openStatus,
      marginTop: 4,
      fontWeight: "500",
    },
    actionsRow: {
      flexDirection: "row",
      marginTop: 12,
      gap: 10,
    },
    sectionTitle: {
      marginTop: 14,
      fontWeight: "600",
      color: theme.buildingInfoPopup.title,
    },
    todayHighlight: {
      fontWeight: "700",
      color: theme.buildingInfoPopup.openStatus,
    },
  });
