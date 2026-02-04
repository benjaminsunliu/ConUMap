import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    PanResponder,
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

interface Props {
    readonly building: BuildingInfo | null;
}

const CLOSE_HEIGHT = 520;
const COLLAPSED_HEIGHT = 175;
const OPEN_TRANSLATE_Y = 0;
const COLLAPSED_TRANSLATE_Y = CLOSE_HEIGHT - COLLAPSED_HEIGHT;

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

    const translateY = useRef(new Animated.Value(COLLAPSED_TRANSLATE_Y)).current;
    const currentTranslateY = useRef(COLLAPSED_TRANSLATE_Y);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (building) {
            Animated.spring(translateY, {
                toValue: COLLAPSED_TRANSLATE_Y,
                useNativeDriver: true,
            }).start(() => {
                currentTranslateY.current = COLLAPSED_TRANSLATE_Y;
            });
            setExpanded(false);
        } else {
            Animated.spring(translateY, {
                toValue: CLOSE_HEIGHT,
                useNativeDriver: true,
            }).start();
        }
    }, [building, translateY]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
            onPanResponderGrant: () =>
                translateY.stopAnimation((y) => {
                    currentTranslateY.current = y;
                }),
            onPanResponderMove: (_, g) => {
                const next = Math.max(
                    OPEN_TRANSLATE_Y,
                    Math.min(
                        COLLAPSED_TRANSLATE_Y,
                        currentTranslateY.current + g.dy
                    )
                );
                translateY.setValue(next);
            },
            onPanResponderRelease: (_, g) => {
                const midpoint =
                    (OPEN_TRANSLATE_Y + COLLAPSED_TRANSLATE_Y) / 2;
                const expand =
                    currentTranslateY.current + g.dy < midpoint || g.vy < -0.5;
                const snapPoint = expand
                    ? OPEN_TRANSLATE_Y
                    : COLLAPSED_TRANSLATE_Y;

                Animated.spring(translateY, {
                    toValue: snapPoint,
                    velocity: g.vy,
                    tension: 80,
                    friction: 14,
                    useNativeDriver: true,
                }).start(() => {
                    currentTranslateY.current = snapPoint;
                });

                setExpanded(expand);
            },
        })
    ).current;

    if (!building) return null;

    const todayIdx =
        new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    const ACTIONS = [
        { label: "Directions", icon: "navigate-outline", type: "directions" as const },
        { label: "Website", icon: "globe-outline", type: "website" as const },
    ];

    const handleAction = (type: "directions" | "website") => {
        const urls = {
            directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                building.address
            )}`,
            website: building.link || "",
        };
        urls[type] && Linking.openURL(urls[type]);
    };

    const formatCamelCase = (text: string) =>
        text
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/^./, (c) => c.toUpperCase());

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.card,
                { transform: [{ translateY }], height: CLOSE_HEIGHT },
            ]}
        >
            <View style={styles.handle} />

            <Text style={styles.title} numberOfLines={1}>
                {building.buildingCode} – {building.buildingName}
            </Text>

            <Text style={styles.line}>
                {building.campus} Campus | {building.address}
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

            {expanded && (
                <ScrollView style={{ marginTop: 10 }}>
                    <View style={styles.rule} />

                    {building.accessibility.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Accessibility</Text>
                            {building.accessibility.map((item) => (
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
            )}
        </Animated.View>
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
