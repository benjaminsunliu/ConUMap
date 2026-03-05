import React, { useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Image,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import InfoPopup from "../ui/popup";
import SwitchSelector from "react-native-switch-selector";
import { TransportationMode } from "@/types/buildingTypes";
import ShuttleIconDark from "@/assets/images/shuttle-icon-dark.png";
import ShuttleIconLight from "@/assets/images/shuttle-icon-light.png";


interface Props {
  readonly routes: Record<TransportationMode, any[] | null>;
  readonly isOpen: boolean;
  readonly onRouteSelect: (route: any) => void;
  readonly onStepSelect?: (encodedPolyline: string, travelMode: string, vehicleType?: string) => void;
}

function stripHtml(html: string): string {
  return html
    .replaceAll(/<div[^>]*>(.*?)<\/div>/gi, " – $1")
    .replaceAll(/<b>(.*?)<\/b>/gi, "$1")
    .replaceAll(/<[^>]+>/g, "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .trim();
}

const transportIconMap: Record<TransportationMode, keyof typeof Ionicons.glyphMap> = {
  walking: "walk-outline",
  transit: "bus-outline",
  driving: "car-outline",
  bicycling: "bicycle-outline",
  shuttle: "school-outline"
};

export default function RoutesInfoPopup({ routes, isOpen, onRouteSelect, onStepSelect }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = makePopupStyles(theme);
  const [tabIndex, setTabIndex] = React.useState(0);
  const [selectedRoute, setSelectedRoute] = React.useState<any>(null);

  const availableTransports = useMemo(
    () => Object.keys(routes).filter(key => routes[key as TransportationMode] !== null),
    [routes]
  );

  useEffect(() => {
    setTabIndex(0);
    setSelectedRoute(null);
  }, [routes]);

  useEffect(() => {
    setSelectedRoute(null);
  }, [tabIndex]);

  const header = useMemo(() => {
    const selectorOptions = availableTransports.map((transport, index) => {
      const shuttleIcon = (
        <Image
          source={colorScheme === "dark" ? ShuttleIconDark : ShuttleIconLight}
          style={{ width: 75, height: 40 }}
        />
      );
      const defaultIcon = (
        <Ionicons
          name={transportIconMap[transport as keyof typeof transportIconMap]}
          size={50}
          color={index === tabIndex ? "#222222" : "#000000"}
        />
      );
      return {
        label: "",
        value: index,
        customIcon: transport === "shuttle" ? shuttleIcon : defaultIcon,
        testID: `${transport}-selector`,
        accessibilityLabel: `${transport}-selector`,
      };
    });

    return (
      <>
        <Text style={styles.headerTitle}>
          {availableTransports[tabIndex]?.replaceAll(/^./g, (c) => c.toUpperCase())}
        </Text>
        <SwitchSelector
          initial={tabIndex}
          textColor={Colors[colorScheme].buildingInfoPopup.text}
          selectedColor={Colors[colorScheme].buildingInfoPopup.handle}
          buttonColor={Colors[colorScheme].buildingInfoPopup.handle}
          borderColor={Colors[colorScheme].buildingInfoPopup.background}
          backgroundColor={Colors[colorScheme].buildingInfoPopup.background}
          bold={true}
          height={50}
          options={selectorOptions}
          testID="navigation-mode-selector"
          accessibilityLabel="navigation-mode-selector"
          onPress={(value: number) => setTabIndex(value)}
        />
      </>
    );
  }, [availableTransports, colorScheme, styles.headerTitle, tabIndex]);

  if (availableTransports.length <= 0) return null;

  const currentMode = availableTransports[tabIndex] as TransportationMode;
  const currentRoutes = routes[currentMode];

  const routeList = (currentRoutes?.length ?? 0) > 0 ? (
    currentRoutes?.map((route: any, index: number) => (
      <RouteOverview
        testID={`${currentMode}-route-${index}`}
        route={route}
        key={`${currentMode}-${route?.legs?.[0]?.duration?.value}-${route?.legs?.[0]?.distance?.value}`}
        onRouteSelect={(r) => {
          onRouteSelect(r);
          setSelectedRoute(r);
        }}
      />
    ))
  ) : (
    <Text testID="no-routes-text" style={styles.noRoutesText}>
      No route found for this mode of transportation.
    </Text>
  );

  return (
    <InfoPopup shouldDisplay={isOpen} header={header} testID="routes-info-popup">
      {selectedRoute ? (
        <>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRoute(null)}
            testID="back-to-routes-button"
          >
            <Ionicons name="arrow-back-outline" size={22} color={theme.buildingInfoPopup.actionButtonText} />
            <Text style={styles.backButtonText}>Back to routes</Text>
          </TouchableOpacity>

          <Text style={styles.stepsSummary}>
            {selectedRoute?.legs?.[0]?.duration?.text} · {selectedRoute?.legs?.[0]?.distance?.text}
          </Text>

          {selectedRoute?.legs?.[0]?.steps?.map((step: any, idx: number) => (
            <RouteStep
              key={step?.polyline?.points ?? idx}
              testID={`${currentMode}-step-${idx}`}
              step={step}
              onPress={() => {
                const encoded = step?.polyline?.points;
                if (encoded && onStepSelect)
                  onStepSelect(
                    encoded,
                    step?.travel_mode ?? "WALK",
                    step?.transit_details?.line?.vehicle_type,
                  );
              }}
            />
          ))}
        </>
      ) : (
        routeList
      )}
    </InfoPopup>
  );
}


const makePopupStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    headerTitle: {
      fontSize: 40,
      fontWeight: "bold",
      marginVertical: 10,
    },
    noRoutesText: {
      color: theme.buildingInfoPopup.text,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 4,
      paddingBottom: 8,
    },
    backButtonText: {
      fontSize: 16,
      color: theme.buildingInfoPopup.actionButtonText,
      fontWeight: "600",
    },
    stepsSummary: {
      fontSize: 18,
      color: theme.buildingInfoPopup.text,
      marginBottom: 12,
      fontWeight: "500",
    },
  });


function RouteOverview({
  route,
  onRouteSelect,
  testID,
}: {
  readonly route: any;
  readonly onRouteSelect: (route: any) => void;
  readonly testID?: string;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = makeOverviewStyles(theme);

  return (
    <TouchableOpacity
      style={styles.overviewContainer}
      onPress={() => onRouteSelect(route)}
      testID={testID}
    >
      <Text style={styles.overviewText}>
        {route?.legs[0]?.duration?.text} for {route?.legs[0]?.distance?.text}
      </Text>
      {route?.legs[0]?.arrival_time && route?.legs[0]?.departure_time ? (
        <Text>
          From {route?.legs[0]?.departure_time.text} To{" "}
          {route?.legs[0]?.arrival_time.text}
        </Text>
      ) : null}
      {route?.summary ? <Text>Via {route?.summary}</Text> : null}
    </TouchableOpacity>
  );
}

const makeOverviewStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    overviewContainer: {
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 1,
      borderRadius: 10,
    },
    overviewText: {
      fontSize: 25,
      fontWeight: "500",
      color: theme.buildingInfoPopup.text,
    },
  });

function RouteStep({
  step,
  onPress,
  testID,
}: {
  readonly step: any;
  readonly onPress: () => void;
  readonly testID?: string;
}) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = makeStepStyles(theme);

  const travelMode: string = step?.travel_mode ?? "WALKING";
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    WALKING: "walk-outline",
    WALK: "walk-outline",
    TRANSIT: "bus-outline",
    DRIVING: "car-outline",
    DRIVE: "car-outline",
    BICYCLING: "bicycle-outline",
    BICYCLE: "bicycle-outline",
  };
  const icon = iconMap[travelMode] ?? "navigate-outline";

  return (
    <TouchableOpacity style={styles.stepContainer} onPress={onPress} testID={testID}>
      <View style={styles.stepIcon}>
        <Ionicons name={icon} size={22} color={theme.buildingInfoPopup.actionButtonIcon} />
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepInstruction}>
          {stripHtml(step?.html_instructions ?? "")}
        </Text>
        <Text style={styles.stepMeta}>
          {step?.distance?.text}
          {step?.duration?.text ? ` · ${step.duration.text}` : ""}
        </Text>
        {step?.transit_details && (
          <Text style={styles.stepTransit}>
            {step.transit_details.line?.short_name ?? step.transit_details.line?.name}
            {" · "}
            {step.transit_details.departure_stop?.name} → {step.transit_details.arrival_stop?.name}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward-outline" size={18} color={theme.buildingInfoPopup.text} />
    </TouchableOpacity>
  );
}

const makeStepStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    stepContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.buildingInfoPopup.divider,
      gap: 10,
    },
    stepIcon: {
      width: 30,
      alignItems: "center",
      paddingTop: 2,
    },
    stepContent: {
      flex: 1,
      gap: 2,
    },
    stepInstruction: {
      fontSize: 15,
      color: theme.buildingInfoPopup.text,
      fontWeight: "500",
    },
    stepMeta: {
      fontSize: 13,
      color: theme.buildingInfoPopup.text,
      opacity: 0.7,
    },
    stepTransit: {
      fontSize: 13,
      color: theme.buildingInfoPopup.actionButtonText,
      fontWeight: "500",
    },
  });
