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
            {open && (<TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} />)}

            <View style={styles.container}>
                <TouchableOpacity style={[{ backgroundColor: theme.floorSelection.buttonBackground }, styles.button]} activeOpacity={0.8} onPress={() => setOpen((prev) => !prev)}>
                    <Ionicons style={styles.chevron} name="chevron-expand-outline" size={25} color={theme.floorSelection.chevron} />
                    <View>
                        <Text style={[{ color: theme.floorSelection.textColor }, styles.mainText]}> Floor {formatFloor(currentFloor)}{"\n"} </Text>
                        <Text style={[{ color: theme.floorSelection.textColor }, styles.subText]}> {buildingName} </Text>
                    </View>
                </TouchableOpacity>

                {open && (
                    <View style={[styles.dropdown, { backgroundColor: theme.floorSelection.dropdown }]}>
                        <FlatList
                            data={sortedFloors}
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[{ borderBottomColor: theme.floorSelection.separator }, styles.floorItem, item === currentFloor && { backgroundColor: theme.floorSelection.selectedFloor }]}
                                    onPress={() => {
                                        onSelectFloor(item);
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={styles.floorText}> Floor {formatFloor(item)} </Text>
                                </TouchableOpacity>
                            )}
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
        width: "35%",
    },
    button: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 5,
    },
    mainText: {
        fontWeight: "600",
        textAlign: "center",
    },
    subText: {
        fontWeight: "300",
    },
    dropdown: {
        marginTop: 8,
        borderRadius: 12,
        maxHeight: "40%",
        overflow: "hidden",
        elevation: 6,
        width: "90%",
        alignSelf: "center",
    },
    floorItem: {
        padding: 12,
        borderBottomWidth: 1,
    },
    floorText: {
        fontSize: 16,
        textAlign: "center",
    },
    chevron: {
        alignSelf: "center"
    }
});

