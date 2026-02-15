import React, { useState, useMemo } from "react";
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import buildingAddressesRaw from "@/data/building-addresses.json";

interface Building {
    buildingCode: string;
    buildingName: string;
    address: string;
    campus: string;
}

type FieldType = "start" | "end";

const buildingAddresses = buildingAddressesRaw as Building[];

const emptyBuilding: Building = {
    buildingCode: "",
    buildingName: "",
    address: "",
    campus: ""
};

interface Props {
    onSelect: (building: Building, type: FieldType) => void;
}

export default function BuildingSelection({ onSelect }: Props) {
    const colorScheme = useColorScheme() ?? "light";
    const theme = Colors[colorScheme];

    const [queries, setQueries] = useState<Record<FieldType, string>>({
        start: "",
        end: ""
    });

    const filterBuildings = (text: string) => {
        const q = text.toLowerCase();
        return buildingAddresses.filter(
            b => b.buildingName.toLowerCase().includes(q) || b.buildingCode.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
        );
    };

    const results = useMemo(
        () => ({
            start: queries.start ? filterBuildings(queries.start) : [],
            end: queries.end ? filterBuildings(queries.end) : []
        }),
        [queries]
    );

    const setQuery = (type: FieldType, value: string) => {
        setQueries(q => ({ ...q, [type]: value }));
    };

    const handleChange = (text: string, type: FieldType) => {
        setQuery(type, text);
    };

    const handleSelect = (building: Building, type: FieldType) => {
        setQuery(type, building.buildingName);
        onSelect(building, type);
    };

    const clearField = (type: FieldType) => {
        setQuery(type, "");
        onSelect(emptyBuilding, type);
    };

    const swapFields = () => {
        setQueries(({ start, end }) => ({ start: end, end: start }));
        onSelect({ ...emptyBuilding, buildingName: queries.end }, "start");
        onSelect({ ...emptyBuilding, buildingName: queries.start }, "end");
    };

    const renderInput = (type: FieldType, placeholder: string) => {
        const value = queries[type];

        return (
            <View style={styles.inputWrapper}>
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor={theme.text}
                    value={value}
                    onChangeText={t => handleChange(t, type)}
                    style={[
                        styles.input,
                        {
                            backgroundColor: theme.buildingInfoPopup.background,
                            borderColor: theme.buildingInfoPopup.divider,
                            color: theme.text
                        }
                    ]}
                />
                {!!value && (
                    <TouchableOpacity onPress={() => clearField(type)} style={styles.clearButton}>
                        <Text style={{ color: theme.tint, fontSize: 18 }}>×</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderResults = (type: FieldType) => {
        const data = results[type];
        if (!data.length) return null;

        return (
            <FlatList
                data={data}
                keyExtractor={i => i.buildingCode}
                style={[
                    styles.results,
                    { backgroundColor: theme.background, borderColor: theme.buildingInfoPopup.divider }
                ]}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item, type)}>
                        <Text style={[styles.resultTitle, { color: theme.campusToggle.selectedColor }]}>
                            {item.buildingCode} – {item.buildingName}
                        </Text>
                        <Text style={[styles.resultAddress, { color: theme.text }]}>{item.address}</Text>
                    </TouchableOpacity>
                )}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, shadowColor: theme.text }]}>
            <View style={styles.inputRow}>
                {renderInput("start", "Start")}
                <TouchableOpacity onPress={swapFields} style={styles.swapButton}>
                    <Ionicons name="swap-vertical" size={24} color={theme.tint} />
                </TouchableOpacity>
                {renderInput("end", "Destination")}
            </View>
            {renderResults("start")}
            {renderResults("end")}
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
