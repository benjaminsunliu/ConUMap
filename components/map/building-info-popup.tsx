import { Colors } from "@/constants/theme";
import { BuildingInfo } from "@/types/mapTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import InfoPopup from "../ui/popup";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ScrollView } from "react-native-gesture-handler";

interface Props {
  building: BuildingInfo | null;
  hasIndoorNavigation: boolean;
  onNavigate?: () => void;
  onSetAsStart?: () => void;
  onExploreRooms?: () => void;
}

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

type IconName = keyof typeof Ionicons.glyphMap;

interface Action {
  type: string;
  label: string;
  icon?: IconName;
  active?: boolean;
  handler?: () => void;
}

export default function BuildingInfoPopup({
  building,
  hasIndoorNavigation,
  onNavigate,
  onSetAsStart,
  onExploreRooms,
}: Readonly<Props>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = makeStyles(theme);

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const openWebsiteURL = useCallback(async () => {
    if (!building?.url) {
      return;
    }
    await openURL(building.url);
  }, [building?.url]);

  const ACTIONS: Action[] = useMemo(
    () => [
      {
        label: "Directions",
        icon: "navigate-outline",
        type: "directions",
        handler: onNavigate,
      },
      {
        label: "Set Start",
        icon: "flag-outline",
        type: "start",
        handler: onSetAsStart,
      },
      {
        label: "Website",
        icon: "globe-outline",
        type: "website",
        handler: openWebsiteURL,
      },
      {
        label: "Explore Rooms",
        icon: "business-outline",
        type: "rooms",
        handler: onExploreRooms,
        active: hasIndoorNavigation,
      },
    ],
    [onNavigate, onSetAsStart, openWebsiteURL, onExploreRooms],
  );

  const header = useMemo(() => {
    return (
      <>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {building?.buildingCode} – {building?.buildingName}
          </Text>

          <Text style={styles.line}>
            {building?.campus} Campus | {building?.address}
          </Text>

          <Text style={styles.openStatus}>Today: {DEFAULT_OPENING_HOURS[todayIdx]}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.actionsRow}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        >
          {ACTIONS.map((a) => (
            <ActionButton
              key={a.type}
              {...a}
              testID={`${a.type}-action-button`}
              onPress={a.handler}
              theme={theme}
            />
          ))}
        </ScrollView>
      </>
    );
  }, [
    ACTIONS,
    building,
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

async function openURL(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      console.warn(`Cannot open URL: ${url}`);
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    console.error(`Failed to open URL ${url}:`, error);
  }
}

function formatCamelCase(text: string) {
  return text
    .replaceAll(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/g, " ")
    .trim()
    .replace(/^./, (match) => match.toUpperCase());
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
  active = true,
}: {
  readonly label: string;
  readonly icon?: IconName;
  readonly onPress?: () => void;
  readonly testID: string;
  readonly theme: typeof Colors.light;
  readonly active?: boolean;
}) => {
  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          borderRadius: 20,
          height: 40,
          backgroundColor: theme.buildingInfoPopup.actionButtonBackground,
        },
      ]}
      onPress={active ? onPress : undefined}
      testID={testID}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          active
            ? theme.buildingInfoPopup.actionButtonIcon
            : theme.buildingInfoPopup.disabledActionButtonColor
        }
        style={{ marginRight: 6 }}
      />
      <Text
        style={{
          color: active
            ? theme.buildingInfoPopup.actionButtonText
            : theme.buildingInfoPopup.disabledActionButtonColor,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const makeStyles = (theme: (typeof Colors)["light" | "dark"]) =>
  StyleSheet.create({
    headerText: {
      paddingHorizontal: 20,
    },
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
      paddingHorizontal: 20,
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
