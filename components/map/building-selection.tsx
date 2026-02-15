import React, { useState } from "react";
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import buildingAddressesRaw from "@/data/building-addresses.json";
import CampusToggle from "./campus-toggle";

interface Building {
    buildingCode: string;
    buildingName: string;
    address: string;
    campus: string;
}

const buildingAddresses: Building[] = buildingAddressesRaw as Building[];

interface Props {
    onSelect: (building: Building, type: "start" | "end") => void;
    mapRef: any;
    viewRegion: any;
}

export default function BuildingSelection({ onSelect, mapRef, viewRegion }: Props) {
    const colorScheme = useColorScheme() ?? "light";
    const theme = Colors[colorScheme];

    const [startQuery, setStartQuery] = useState("");
    const [endQuery, setEndQuery] = useState("");
    const [startResults, setStartResults] = useState<Building[]>([]);
    const [endResults, setEndResults] = useState<Building[]>([]);

    const handleChange = (text: string, type: "start" | "end") => {
        const filtered = buildingAddresses.filter(
            (b) =>
                b.buildingName.toLowerCase().includes(text.toLowerCase()) ||
                b.buildingCode.toLowerCase().includes(text.toLowerCase()) ||
                b.address.toLowerCase().includes(text.toLowerCase())
        );

        if (type === "start") {
            setStartQuery(text);
            setStartResults(filtered);
        } else {
            setEndQuery(text);
            setEndResults(filtered);
        }
    };

    const handleSelect = (building: Building, type: "start" | "end") => {
        if (type === "start") {
            setStartQuery(building.buildingName);
            setStartResults([]);
        } else {
            setEndQuery(building.buildingName);
            setEndResults([]);
        }
        onSelect(building, type);
    };

    const swapFields = () => {
        const tempQuery = startQuery;
        const tempResults = startResults;
        setStartQuery(endQuery);
        setStartResults(endResults);
        setEndQuery(tempQuery);
        setEndResults(tempResults);
        onSelect({ buildingCode: "", buildingName: endQuery, address: "", campus: "" }, "start");
        onSelect({ buildingCode: "", buildingName: tempQuery, address: "", campus: "" }, "end");
    };

    const clearField = (type: "start" | "end") => {
        if (type === "start") {
            setStartQuery("");
            setStartResults([]);
            onSelect({ buildingCode: "", buildingName: "", address: "", campus: "" }, "start");
        } else {
            setEndQuery("");
            setEndResults([]);
            onSelect({ buildingCode: "", buildingName: "", address: "", campus: "" }, "end");
        }
    };

    const renderResults = (results: Building[], type: "start" | "end") => (
        <FlatList
            data={results}
            keyExtractor={(item) => item.buildingCode}
            style={[styles.results, { backgroundColor: theme.background, borderColor: theme.buildingInfoPopup.divider }]}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item, type)}>
                    <Text style={[styles.resultTitle, { color: theme.text }]}>{item.buildingCode} – {item.buildingName}</Text>
                    <Text style={[styles.resultAddress, { color: theme.buildingInfoPopup.text }]}>{item.address}</Text>
                </TouchableOpacity>
            )}
        />
    );

    const renderInput = (value: string, onChange: (text: string) => void, type: "start" | "end", placeholder: string) => (
        <View style={styles.inputWrapper}>
            <TextInput
                placeholder={placeholder}
                placeholderTextColor={theme.text}
                value={value}
                onChangeText={onChange}
                style={[styles.input, { backgroundColor: theme.buildingInfoPopup.background, borderColor: theme.buildingInfoPopup.divider, color: theme.text }]}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => clearField(type)} style={styles.clearButton}>
                    <Text style={{ color: theme.tint, fontSize: 18 }}>×</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, shadowColor: theme.text }]}>
            <CampusToggle mapRef={mapRef} viewRegion={viewRegion} />

            <View style={styles.inputRow}>
                {renderInput(startQuery, text => handleChange(text, "start"), "start", "Start")}
                <TouchableOpacity onPress={swapFields} style={styles.swapButton}>
                    <Ionicons name="swap-vertical" size={24} color={theme.tint} />
                </TouchableOpacity>
                {renderInput(endQuery, text => handleChange(text, "end"), "end", "Destination")}
            </View>
            {startResults.length > 0 && renderResults(startResults, "start")}
            {endResults.length > 0 && renderResults(endResults, "end")}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 10,
        padding: 8
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    inputWrapper: {
        flex: 1,
        position: "relative",
        marginHorizontal: 4
    },
    input: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 1
    },
    clearButton: {
        position: "absolute",
        right: 10,
        top: "50%",
        transform: [{ translateY: -10 }],
    },
    swapButton: {
        padding: 4,
    },
    results: {
        maxHeight: 180,
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1
    },
    resultItem: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    },
    resultTitle: {
        fontWeight: "600"
    },
    resultAddress: {
        fontSize: 12
    }
});
