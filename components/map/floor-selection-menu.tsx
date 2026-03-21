import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";

interface FloorSelectorProps {
    buildingName: string;
    availableFloors: number[];
    currentFloor: number;
    onSelectFloor: (floor: number) => void;
}

export default function FloorSelector({ buildingName, availableFloors, currentFloor, onSelectFloor }: FloorSelectorProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const [open, setOpen] = useState(false);
    const sortedFloors = [...availableFloors].sort((a, b) => a - b);
    const formatFloor = (floor: number) => {
        if (floor < 0) return `B${Math.abs(floor)}`;
        return `${floor}`;
    };

    return (
        <>
            {open && (<TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)} />)}

            <View style={styles.container}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.floorSelection.buttonBackground }]}
                    activeOpacity={0.85}
                    onPress={() => setOpen((prev) => !prev)}
                >
                    <View style={styles.left}>
                        <Text style={[styles.mainText, { color: theme.floorSelection.textColor }]}>
                            Floor {formatFloor(currentFloor)}
                        </Text>

                        <Text style={[styles.subText, { color: theme.floorSelection.textColor }]} numberOfLines={1}>
                            {buildingName}
                        </Text>
                    </View>

                    <Ionicons name={open ? "chevron-up" : "chevron-down"} size={22} color={theme.floorSelection.chevron} />
                </TouchableOpacity>

                {open && (
                    <View style={[styles.dropdown, { backgroundColor: theme.floorSelection.dropdown }]}>
                        <FlatList
                            data={sortedFloors}
                            keyExtractor={(item) => item.toString()}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const isActive = item === currentFloor;

                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.floorItem,
                                            { borderBottomColor: theme.floorSelection.separator },
                                            isActive && { backgroundColor: theme.floorSelection.selectedFloor }
                                        ]}
                                        onPress={() => {
                                            onSelectFloor(item);
                                            setOpen(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.floorText,
                                                {
                                                    color: theme.floorSelection.textColor,
                                                    fontWeight: isActive ? "700" : "500",
                                                }
                                            ]}
                                        >
                                            Floor {formatFloor(item)}
                                        </Text>

                                        {isActive && (<Ionicons name="checkmark" size={18} color={theme.floorSelection.chevron} />)}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: "5%",
        alignSelf: "center",
        zIndex: 11,
        width: "40%",
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 22,
        elevation: 6
    },
    left: {
        flex: 1
    },
    mainText: {
        fontSize: 16,
        fontWeight: "700"
    },
    subText: {
        fontSize: 12,
        opacity: 0.8,
        marginTop: 2
    },
    dropdown: {
        marginTop: 10,
        borderRadius: 14,
        maxHeight: 220,
        overflow: "hidden",
        elevation: 8
    },
    floorItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    floorText: {
        fontSize: 15
    }
});