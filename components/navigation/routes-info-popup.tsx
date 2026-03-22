import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, Image, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import InfoPopup from "../ui/popup";
import SwitchSelector from "react-native-switch-selector";
import { TransportationMode } from "@/types/buildingTypes";
import ShuttleIconDark from "@/assets/images/shuttle-icon-dark.png";
import ShuttleIconLight from "@/assets/images/shuttle-icon-light.png";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface Props {
  readonly routes: Record<TransportationMode, any[] | null>;
  readonly isOpen: boolean;
  readonly onRouteSelect: (route: any) => void;
  readonly onStepSelect?: (
    encodedPolyline: string,
    travelMode: string,
    vehicleType?: string,
  ) => void;
  readonly onBack?: () => void;
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

function getRouteKey(route: any, mode: TransportationMode, index: number): string {
  const overviewPolyline = route?.overview_polyline?.points;
  if (overviewPolyline) {
    return `${mode}-${overviewPolyline}-${index}`;
  }

  const firstLeg = route?.legs?.[0];
  const duration = firstLeg?.duration?.value ?? "na";
  const distance = firstLeg?.distance?.value ?? "na";
  return `${mode}-${duration}-${distance}-${index}`;
}

const transportIconMap: Record<TransportationMode, keyof typeof Ionicons.glyphMap> = {
  walking: "walk-outline",
  transit: "bus-outline",
  driving: "car-outline",
  bicycling: "bicycle-outline",
  shuttle: "school-outline",
};

const transportOrder: TransportationMode[] = [
  "walking",
  "transit",
  "driving",
  "bicycling",
  "shuttle",
];

export default function RoutesInfoPopup({
  routes,
  isOpen,
  onRouteSelect,
  onStepSelect,
  onBack,
}: Props) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = makePopupStyles(theme);
  const [tabIndex, setTabIndex] = React.useState(0);
  const [selectedRoute, setSelectedRoute] = React.useState<any>(null);
  const [selectorVersion, setSelectorVersion] = React.useState(0);

  const availableTransports = transportOrder.filter((mode) => routes[mode] !== null);
  const defaultTabIndex = Math.max(availableTransports.indexOf("walking"), 0);
  const routeResetToken = transportOrder
    .map((mode) => {
      const modeRoutes = routes[mode];
      if (modeRoutes === null) {
        return `${mode}:null`;
      }

      if (modeRoutes.length === 0) {
        return `${mode}:empty`;
      }

      return `${mode}:${modeRoutes.length}:${getRouteKey(modeRoutes[0], mode, 0)}`;
    })
    .join("|");

  useEffect(() => {
    setTabIndex(defaultTabIndex);
    setSelectedRoute(null);
    setSelectorVersion((value) => value + 1);
  }, [defaultTabIndex, routeResetToken]);

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
          name={transportIconMap[transport]}
          size={50}
          color={
            index === tabIndex
              ? theme.routesInfoPopup.selectedIcon
              : theme.routesInfoPopup.icon
          }
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
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.headerBackButton}
            testID="routes-back-button"
          >
            <Ionicons name="arrow-back" size={28} color={theme.buildingInfoPopup.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {availableTransports[tabIndex]?.replaceAll(/^./g, (c) => c.toUpperCase())}
        </Text>
        <SwitchSelector
          key={`navigation-mode-selector-${selectorVersion}`}
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
  }, [
    availableTransports,
    colorScheme,
    onBack,
    selectorVersion,
    styles.headerBackButton,
    styles.headerTitle,
    tabIndex,
    theme,
  ]);

  if (availableTransports.length <= 0) {
    return null;
  }

  const currentMode = availableTransports[tabIndex];
  const currentRoutes = routes[currentMode];

  const routeList =
    (currentRoutes?.length ?? 0) > 0 ? (
      currentRoutes?.map((route: any, index: number) => (
        <RouteOverview
          testID={`${currentMode}-route-${index}`}
          route={route}
          key={getRouteKey(route, currentMode, index)}
          onRouteSelect={(selected) => {
            onRouteSelect(selected);
            setSelectedRoute(selected);
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
            <Ionicons
              name="arrow-back-outline"
              size={22}
              color={theme.buildingInfoPopup.actionButtonText}
            />
            <Text style={styles.backButtonText}>Back to routes</Text>
          </TouchableOpacity>

          <Text style={styles.stepsSummary}>
            {selectedRoute?.legs?.[0]?.duration?.text} ·{" "}
            {selectedRoute?.legs?.[0]?.distance?.text}
          </Text>

          {selectedRoute?.legs?.[0]?.steps?.map((step: any, index: number) => (
            <RouteStep
              key={step?.polyline?.points ?? index}
              testID={`${currentMode}-step-${index}`}
              step={step}
              onPress={() => {
                const encoded = step?.polyline?.points;
                if (encoded && onStepSelect) {
                  onStepSelect(
                    encoded,
                    step?.travel_mode ?? "WALK",
                    step?.transit_details?.line?.vehicle_type,
                  );
                }
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
      color: theme.buildingInfoPopup.title,
    },
    headerBackButton: {
      position: "absolute",
      top: 10,
      left: 10,
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
  const colorScheme = useColorScheme();
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
        <Text style={styles.routeInfo}>
          From {route?.legs[0]?.departure_time.text} To{" "}
          {route?.legs[0]?.arrival_time.text}
        </Text>
      ) : null}
      {route?.summary ? <Text style={styles.routeInfo}>Via {route?.summary}</Text> : null}
    </TouchableOpacity>
  );
}

const makeOverviewStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    overviewContainer: {
      padding: 20,
      shadowColor: theme.routesInfoPopup.icon,
      shadowOffset: {
        width: 0,
        height: 2,
      },
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
    routeInfo: {
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
  const colorScheme = useColorScheme();
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
        <Ionicons
          name={icon}
          size={22}
          color={theme.buildingInfoPopup.actionButtonIcon}
        />
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
            {step.transit_details.departure_stop?.name} →{" "}
            {step.transit_details.arrival_stop?.name}
          </Text>
        )}
      </View>
      <Ionicons
        name="chevron-forward-outline"
        size={18}
        color={theme.buildingInfoPopup.text}
      />
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
