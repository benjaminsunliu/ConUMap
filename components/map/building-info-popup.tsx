import React, { useCallback, useMemo } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Linking,
    useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BuildingInfo } from "@/data/parsedBuildings";
import { Colors } from "@/constants/theme";
import InfoPopup from "../ui/popup";

interface Props {
    readonly building: BuildingInfo | null;
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

export default function BuildingInfoPopup({ building }: Props) {
    const colorScheme = useColorScheme() ?? "light";
    const theme = Colors[colorScheme];
    const styles = makeStyles(theme);

    const todayIdx =
        new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    const ACTIONS = useMemo(() => [
        { label: "Directions", icon: "navigate-outline", type: "directions" as const },
        { label: "Website", icon: "globe-outline", type: "website" as const },
    ],[]);

    const handleAction = useCallback(async (type: "directions" | "website") => {
        const urls: Record<typeof type, string> = {
            directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(!!(building?.address))}`,
            website: building?.link || "",
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
    }, [building?.address, building?.link]);

    const formatCamelCase = useCallback((text: string) =>
        text
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/^./, (c) => c.toUpperCase()), []);

    const header = useMemo(() => {
        return (
            <>
                <View style={styles.handle} />

                <Text style={styles.title} numberOfLines={1}>
                    {building?.buildingCode} – {building?.buildingName}
                </Text>

                <Text style={styles.line}>
                    {building?.campus} Campus | {building?.address}
                </Text>

                <Text style={styles.openStatus}>
                    Today: {DEFAULT_OPENING_HOURS[todayIdx]}
                </Text>

                <View style={styles.actionsRow}>
                    {ACTIONS.map((a) => (
                        <ActionButton
                            key={a.type}
                            {...a}
                            onPress={() => handleAction(a.type)}
                            theme={theme}
                        />
                    ))}
                </View>
            </>
        );
    },[ACTIONS, building?.address, building?.buildingCode, building?.buildingName, building?.campus, handleAction, styles.actionsRow, styles.handle, styles.line, styles.openStatus, styles.title, theme, todayIdx]);

    return (
        <InfoPopup shouldDisplay={!!building} header={header}>
            <ScrollView style={{ marginTop: 10 }}>
                    <View style={styles.rule} />

                    {(building?.accessibility?.length ? building?.accessibility?.length : 0) > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Accessibility</Text>
                            {building?.accessibility.map((item) => (
                                <ListItem
                                    key={item}
                                    text={formatCamelCase(item)}
                                    theme={theme}
                                />
                            ))}
                        </>
                    )}

                    <Text style={styles.sectionTitle}>Opening Hours</Text>
                    {DEFAULT_OPENING_HOURS.map((h, i) => (
                        <Text
                            key={WEEKDAYS[i]}
                            style={[
                                styles.line,
                                i === todayIdx && styles.todayHighlight,
                            ]}
                        >
                            {"  "}
                            {WEEKDAYS[i]}: {h}
                        </Text>
                    ))}
                </ScrollView>
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
    theme,
}: {
    readonly label: string;
    readonly icon: string;
    readonly onPress: () => void;
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
        card: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.buildingInfoPopup.background,
            paddingHorizontal: 20,
            paddingTop: 10,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            elevation: 15
        },
        handle: {
            width: 40,
            height: 5,
            backgroundColor: theme.buildingInfoPopup.handle,
            borderRadius: 3,
            alignSelf: "center",
            marginBottom: 8
        },
        title: {
            fontSize: 22,
            fontWeight: "600",
            color: theme.buildingInfoPopup.title,
            marginBottom: 4
        },
        line: {
            color: theme.buildingInfoPopup.text,
            marginTop: 4
        },
        openStatus: {
            color: theme.buildingInfoPopup.openStatus,
            marginTop: 4,
            fontWeight: "500"
        },
        actionsRow: {
            flexDirection: "row",
            marginTop: 12,
            gap: 10
        },
        sectionTitle: {
            marginTop: 14,
            fontWeight: "600",
            color: theme.buildingInfoPopup.title
        },
        rule: {
            borderBottomColor: theme.buildingInfoPopup.divider,
            borderBottomWidth: StyleSheet.hairlineWidth,
            marginVertical: 12
        },
        todayHighlight: {
            fontWeight: "700",
            color: theme.buildingInfoPopup.openStatus
        }
    });
