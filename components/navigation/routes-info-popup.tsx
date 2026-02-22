import React, { useMemo } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    Image,
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
}

const transportIconMap: Record<TransportationMode, keyof typeof Ionicons.glyphMap> = {
  walking: "walk-outline",
  transit: "bus-outline",
  driving: "car-outline",
  bicycling: "bicycle-outline",
  shuttle: "school-outline"
};

export default function RoutesInfoPopup({ routes, isOpen, onRouteSelect }: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = makePopupStyles(theme);
  const [tabIndex, setTabIndex] = React.useState(0);

  const availableTransports = useMemo(() => Object.keys(routes).filter(key => routes[key as TransportationMode] !== null), [routes])

  const header = useMemo(() => {
    return (
      <>
        <Text style={styles.headerTitle}>{availableTransports[tabIndex]?.replaceAll(/^./g, (c) => c.toUpperCase())}</Text>
        <SwitchSelector
          initial={tabIndex}
          textColor={Colors[colorScheme].buildingInfoPopup.text}
          selectedColor={Colors[colorScheme].buildingInfoPopup.handle}
          buttonColor={Colors[colorScheme].buildingInfoPopup.handle}
          borderColor={Colors[colorScheme].buildingInfoPopup.background}
          backgroundColor={Colors[colorScheme].buildingInfoPopup.background}
          bold={true}
          height={50}
          options={availableTransports.map((transport, index) => {
            return {
              label: "",
              value: index,
              customIcon: transport === "shuttle" ? <Image source={colorScheme === "dark" ? ShuttleIconDark : ShuttleIconLight} style={{width: 75, height: 40}}/> : <Ionicons name={transportIconMap[transport as keyof typeof transportIconMap]} size={50} color={index === tabIndex ? "#222222" : "#000000"} />,
              testID: `${transport}-selector`
            }
          })}
          testID="navigation-mode-selector"
          accessibilityLabel="navigation-mode-selector"
          onPress={(value: number) => setTabIndex(value)}
        />
      </>
      
    );
  },[availableTransports, colorScheme, styles.headerTitle, tabIndex]);
  if (availableTransports.length <= 0) return null;
  return (
    <InfoPopup shouldDisplay={isOpen} header={header}>
      {(routes[availableTransports[tabIndex] as TransportationMode]?.length ?? 0) > 0 ? routes[availableTransports[tabIndex] as TransportationMode]?.map((route: any, index: number) => <RouteOverview testID={`${availableTransports[tabIndex]}-route-${index}`} route={route} key={`${availableTransports[tabIndex]}-route-${index}`} onRouteSelect={onRouteSelect}/>) : <Text testID="no-routes-text" style={styles.noRoutesText}>No route found for this mode of transportation.</Text>}
    </InfoPopup>
  );
}

const makePopupStyles = (theme: typeof Colors.light) => {
  return StyleSheet.create({
    headerTitle: {
      fontSize: 40,
      fontWeight: "bold",
      marginVertical: 10,
    },
    noRoutesText: {
      color: theme.buildingInfoPopup.text,
    }
  });
}

function RouteOverview({route, onRouteSelect, testID}: {readonly route: any, readonly onRouteSelect: (route: any) => void, readonly testID?: string}) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const styles = makeOverviewStyles(theme);

  return (
    <TouchableOpacity style={styles.overviewContainer} onPress={() => onRouteSelect(route)} testID={testID}>
      <Text style={styles.overviewText}>{route?.legs[0]?.duration?.text} for {route?.legs[0]?.distance?.text}</Text>
      {route?.legs[0]?.arrival_time && route?.legs[0]?.departure_time ? <Text>From {route?.legs[0]?.departure_time.text} To {route?.legs[0]?.arrival_time.text}</Text> : null}
      {route?.summary? <Text>Via {route?.summary}</Text> : null}
    </TouchableOpacity>
  );
}

const makeOverviewStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    overviewContainer: {
      padding: 20,
      shadowColor: "#000",
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
  }
);
