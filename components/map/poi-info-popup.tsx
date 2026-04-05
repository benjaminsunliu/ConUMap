import { Colors } from "@/constants/theme";
import { POI } from "@/types/mapTypes";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import InfoPopup from "../ui/popup";
import { useCallback, useMemo } from "react";
import { ActionButton, ActionIconName } from "./action-button";

interface Props {
  readonly poi: POI | null;
  readonly onNavigate?: () => void;
}

interface Action {
  type: string;
  label: string;
  icon?: ActionIconName;
  active?: boolean;
  handler?: () => void;
}

export function POIInfoPopup({ poi, onNavigate }: Props) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = makeStyles(theme);

  const handleCall = useCallback(async () => {
    if (!poi?.international_phone_number) return;
    const phoneUrl = `tel:${poi.international_phone_number}`;
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      }
    } catch (error) {
      console.error("Failed to open phone:", error);
    }
  }, [poi?.international_phone_number]);

  const ACTIONS: Action[] = useMemo(
    () => [
      {
        label: "Directions",
        icon: "navigate-outline",
        type: "directions",
        handler: onNavigate,
        active: !!onNavigate,
      },
      {
        label: "Call",
        icon: "call-outline",
        type: "call",
        handler: handleCall,
        active: !!poi?.international_phone_number,
      },
    ],
    [onNavigate, handleCall, poi?.international_phone_number],
  );

  const header = useMemo(() => {
    return (
      <>
        <View style={styles.headerText}>
          <Text style={styles.title}>{poi?.name}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.rating}>
              {(poi?.rating ?? 0).toFixed(1)}
              {"⭐"}
            </Text>
            {poi?.user_ratings_total ? (
              <Text style={styles.reviewCount}>({poi.user_ratings_total})</Text>
            ) : (
              <Text style={styles.reviewCount}>(0)</Text>
            )}
          </View>

          {poi?.opening_hours?.open_now && (
            <Text
              style={[
                styles.openStatus,
                {
                  color: poi.opening_hours.open_now
                    ? theme.buildingInfoPopup.openStatus
                    : theme.buildingInfoPopup.closedStatus,
                },
              ]}
            >
              {poi.opening_hours.open_now ? "Open Now" : "Closed"}
            </Text>
          )}

          {poi?.international_phone_number && (
            <Text style={styles.phone}>{poi.international_phone_number}</Text>
          )}

          {poi?.vicinity && <Text style={styles.address}>{poi.vicinity}</Text>}
        </View>

        <View style={styles.actionsRow}>
          {ACTIONS.map((a) => (
            <ActionButton
              key={a.type}
              {...a}
              testID={`${a.type}-action-button`}
              onPress={a.handler}
              theme={theme}
            />
          ))}
        </View>
      </>
    );
  }, [poi, ACTIONS, styles, theme]);

  return <InfoPopup shouldDisplay={!!poi} header={header} testID="poi-info-popup" />;
}

const makeStyles = (theme: (typeof Colors)["light" | "dark"]) =>
  StyleSheet.create({
    headerText: {
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "600",
      color: theme.buildingInfoPopup.title,
      marginBottom: 8,
      flexShrink: 1,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    rating: {
      color: theme.buildingInfoPopup.text,
      fontSize: 16,
      fontWeight: "500",
    },
    reviewCount: {
      color: theme.buildingInfoPopup.text,
      fontSize: 14,
      marginLeft: 4,
    },
    phone: {
      color: theme.buildingInfoPopup.text,
      marginTop: 6,
    },
    address: {
      color: theme.buildingInfoPopup.text,
      marginTop: 4,
      fontStyle: "italic",
    },
    openStatus: {
      color: theme.buildingInfoPopup.openStatus,
      fontWeight: "600",
      marginTop: 4,
    },
    actionsRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 8,
    },
  });
