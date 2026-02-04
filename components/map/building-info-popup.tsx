import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from "react-native";
import { BuildingInfo } from "@/data/parsedBuildings";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    readonly building: BuildingInfo | null;
}

const CLOSE_HEIGHT = 520;
const COLLAPSED_HEIGHT = 175;
const OPEN_TRANSLATE_Y = 0;
const COLLAPSED_TRANSLATE_Y = CLOSE_HEIGHT - COLLAPSED_HEIGHT;
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
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
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderGrant: () =>
                translateY.stopAnimation((currentY) => {
                    currentTranslateY.current = currentY;
                }),
            onPanResponderMove: (_, gestureState) => {
                const next = Math.max(
                    OPEN_TRANSLATE_Y,
                    Math.min(COLLAPSED_TRANSLATE_Y, currentTranslateY.current + gestureState.dy)
                );
                translateY.setValue(next);
            },
            onPanResponderRelease: (_, gestureState) => {
                const midpoint = (OPEN_TRANSLATE_Y + COLLAPSED_TRANSLATE_Y) / 2;
                const expand = currentTranslateY.current + gestureState.dy < midpoint || gestureState.vy < -0.5;
                const snapPoint = expand ? OPEN_TRANSLATE_Y : COLLAPSED_TRANSLATE_Y;
                Animated.spring(translateY, {
                    toValue: snapPoint,
                    velocity: gestureState.vy,
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

    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    const ACTIONS = [
        { label: "Directions", icon: "navigate-outline", type: "directions" as const },
        { label: "Website", icon: "globe-outline", type: "website" as const },
    ];

    const handleAction = (type: "directions" | "website") => {
        const urlMap = {
            directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(building.address)}`,
            website: building.link || "",
        };
        urlMap[type] && Linking.openURL(urlMap[type]);
    };

    const formatCamelCase = (text: string) => {
        const result = text.replaceAll(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[styles.card, { bottom: 0, transform: [{ translateY }], height: CLOSE_HEIGHT }]}
        >
            <View style={styles.handle} />
            <Text style={styles.title} numberOfLines={1}>
                {building.buildingCode} – {building.buildingName}
            </Text>

            <Text style={styles.line}>
                {building.campus} Campus | {building.address}
            </Text>

            <Text style={styles.openStatus}>Today: {DEFAULT_OPENING_HOURS[todayIdx]}</Text>

            <View style={styles.actionsRow}>
                {ACTIONS.map((a) => (
                    <ActionButton key={a.type} label={a.label} icon={a.icon} onPress={() => handleAction(a.type)} />
                ))}
            </View>

            {expanded && (
                <ScrollView style={{ marginTop: 10 }}>
                    <View style={styles.rule} />

                    {building.accessibility.length > 0 && (
                        <AccessibilityList items={building.accessibility.map(formatCamelCase)} />
                    )}

                    <OpeningHoursList todayIdx={todayIdx} />
                </ScrollView>
            )}
        </Animated.View>
    );
}

const AccessibilityList = ({ items }: { readonly items: string[] }) => (
    <>
        <Text style={styles.sectionTitle}>Accessibility</Text>
        {items.map((item) => (
            <ListItem key={item} icon="checkmark-circle-outline" text={item} />
        ))}
    </>
);

const OpeningHoursList = ({ todayIdx }: { readonly todayIdx: number }) => (
    <>
        <Text style={styles.sectionTitle}>Opening Hours</Text>
        {DEFAULT_OPENING_HOURS.map((h, i) => (
            <Text
                key={`hours-${WEEKDAYS[i]}`}
                style={[
                    styles.line,
                    i === todayIdx && { fontWeight: "700", color: "#1e8e3e" },
                ]}
            >
                {WEEKDAYS[i]}: {h}
            </Text>
        ))}
    </>
);

const ListItem = ({ icon, text }: { readonly icon: string; readonly text: string }) => (
    <View style={styles.lineRow}>
        <Ionicons name={icon as any} size={18} color="#1e8e3e" style={{ marginRight: 6 }} />
        <Text style={styles.line}>{text}</Text>
    </View>
);

const ActionButton = ({ label, icon, onPress }: { readonly label: string; readonly icon: string; readonly onPress: () => void }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <Ionicons name={icon as any} size={18} color="#1a73e8" style={{ marginRight: 6 }} />
        <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    card: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        paddingHorizontal: 20,
        paddingTop: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 15,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: "#ccc",
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 8
    },
    title: {
        fontSize: 22,
        fontWeight: "600",
        marginBottom: 4
    },
    openStatus: {
        color: "#1e8e3e",
        marginTop: 4,
        fontWeight: "500"
    },
    actionsRow: {
        flexDirection: "row",
        marginTop: 12,
        gap: 10
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e8f0fe",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    actionText: {
        color: "#1a73e8",
        fontWeight: "500"
    },
    sectionTitle: {
        marginTop: 14,
        fontWeight: "600"
    },
    rule: {
        borderBottomColor: "#ddd",
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginVertical: 12
    },
    line: {
        color: "#333",
        marginTop: 4
    },
    lineRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
        marginLeft: 6
    }
});
