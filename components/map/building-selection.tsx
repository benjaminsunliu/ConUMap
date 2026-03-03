import React, { useState, useMemo, useCallback } from "react";
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import buildingAddressesRaw from "@/data/building-addresses.json";
import { SearchBuilding, FieldType } from "@/types/buildingTypes";

const buildingAddresses = buildingAddressesRaw as SearchBuilding[];

const emptyBuilding: SearchBuilding = {
    buildingCode: "",
    buildingName: "",
    address: "",
    campus: ""
};

/**
 * Separates buildings into current and other, returning current buildings first.
 * This prioritizes user's current location in search results.
 */
function prioritizeCurrentBuildings(
    buildings: SearchBuilding[], 
    currentCodes: Set<string>
): SearchBuilding[] {
    const currentBuildings: SearchBuilding[] = [];
    const otherBuildings: SearchBuilding[] = [];
    
    buildings.forEach(building => {
        if (currentCodes.has(building.buildingCode)) {
            currentBuildings.push(building);
        } else {
            otherBuildings.push(building);
        }
    });
    
    return [...currentBuildings, ...otherBuildings];
}

interface Props {
    readonly currentBuildingCodes?: Set<string>;
    readonly onSelect: (building: SearchBuilding, type: FieldType) => void;
}

export default function BuildingSelection({ currentBuildingCodes = new Set(), onSelect }: Props) {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme];

    const [queries, setQueries] = useState<Record<FieldType, string>>({
        start: "",
        end: ""
    });

    const [, setSelectedBuildings] = useState<Record<FieldType, SearchBuilding>>({
        start: emptyBuilding,
        end: emptyBuilding
    });

    const [focusedField, setFocusedField] = useState<FieldType | null>(null);

    const filterBuildings = useCallback((text: string, fieldType: FieldType) => {
        const q = text.toLowerCase();
        const filtered = buildingAddresses.filter(
            b =>
                b.buildingName.toLowerCase().includes(q) ||
                b.buildingCode.toLowerCase().includes(q) ||
                b.address.toLowerCase().includes(q)
        );

        if (fieldType === "start" && currentBuildingCodes.size > 0) {
            return prioritizeCurrentBuildings(filtered, currentBuildingCodes);
        }

        return filtered;
    }, [currentBuildingCodes]);

    const results = useMemo(
        () => {
            let startResults: SearchBuilding[];
            if (queries.start) {
                // User is typing - filter and prioritize current buildings
                startResults = filterBuildings(queries.start, "start");
            } else if (currentBuildingCodes.size > 0) {
                // No search text - show only current buildings
                startResults = buildingAddresses.filter(b => currentBuildingCodes.has(b.buildingCode));
            } else {
                // No search text and no current building - show nothing
                startResults = [];
            }

            return {
                start: startResults,
                end: queries.end ? filterBuildings(queries.end, "end") : []
            };
        },
        [queries, filterBuildings, currentBuildingCodes]
    );

    const setQuery = useCallback((type: FieldType, value: string) => {
        setQueries(q => ({ ...q, [type]: value }));
    }, []);

    const handleChange = useCallback(
        (text: string, type: FieldType) => {
            setQuery(type, text);
            setSelectedBuildings(prev => ({ ...prev, [type]: emptyBuilding }));
        },
        [setQuery]
    );

    const handleSelect = useCallback(
        (building: SearchBuilding, type: FieldType) => {
            setQuery(type, building.buildingName);
            setSelectedBuildings(prev => ({ ...prev, [type]: building }));
            setFocusedField(null);
            onSelect(building, type);
        },
        [setQuery, onSelect]
    );

    const clearField = useCallback(
        (type: FieldType) => {
            setQuery(type, "");
            setSelectedBuildings(prev => ({ ...prev, [type]: emptyBuilding }));
            setFocusedField(type);
            onSelect(emptyBuilding, type);
        },
        [setQuery, onSelect]
    );

    const swapFields = useCallback(() => {
        setQueries(prevQueries => {
            setSelectedBuildings(prevBuildings => {
                const swappedBuildings = {
                    start: prevBuildings.end,
                    end: prevBuildings.start
                };

                onSelect(swappedBuildings.start, "start");
                onSelect(swappedBuildings.end, "end");
                return swappedBuildings;
            });

            return {
                start: prevQueries.end,
                end: prevQueries.start
            };
        });

        setFocusedField(null);
    }, [onSelect]);

    const renderInput = useCallback(
        (type: FieldType, placeholder: string) => {
            const value = queries[type];

            return (
                <View style={styles.inputWrapper}>
                    <TextInput
                        placeholder={placeholder}
                        placeholderTextColor={theme.text}
                        value={value}
                        onFocus={() => setFocusedField(type)}
                        onBlur={() => setFocusedField(prev => (prev === type ? null : prev))}
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
                        <TouchableOpacity testID={`clear-${type}`} onPress={() => clearField(type)} style={styles.clearButton}>
                            <Text style={{ color: theme.campusToggle.borderColor, fontSize: 18 }}>×</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }, [queries, theme.text, theme.buildingInfoPopup.background, theme.buildingInfoPopup.divider, theme.campusToggle.borderColor, handleChange, clearField]
    );

    const renderResults = useCallback(
        (type: FieldType) => {
            const data = results[type];
            if (!data.length || focusedField !== type) return null;

            return (
                <FlatList
                    data={data}
                    keyExtractor={i => i.buildingCode}
                    style={[styles.results, { backgroundColor: theme.background, borderColor: theme.buildingInfoPopup.divider }]}
                    keyboardShouldPersistTaps="handled"
                    testID={`${type}-results`}
                    renderItem={({ item }) => {
                        const isCurrent = type === "start" && currentBuildingCodes.has(item.buildingCode);
                        return (
                            <TouchableOpacity
                                style={[styles.resultItem, { borderBottomColor: theme.buildingInfoPopup.divider }]}
                                onPress={() => handleSelect(item, type)} 
                                testID={`${type}-result-${item.buildingCode.toUpperCase()}`}>
                                <Text style={[styles.resultTitle, { color: theme.campusToggle.selectedColor }]}>
                                    {isCurrent && "📍 "}{item.buildingCode} – {item.buildingName}
                                    {isCurrent && <Text style={styles.currentLabel}> (Current Building)</Text>}
                                </Text>
                                <Text style={[styles.resultAddress, { color: theme.text }]}>
                                    {item.address}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            );
        },
        [results, focusedField, theme.background, theme.buildingInfoPopup.divider, theme.campusToggle.selectedColor, theme.text, handleSelect, currentBuildingCodes]
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, shadowColor: theme.text }]} testID="building-selection">
            <View style={styles.inputRow}>
                {renderInput("start", "Start")}
                <TouchableOpacity testID="swap-fields" onPress={swapFields} style={styles.swapButton}>
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
        marginBottom: 6
    },
    inputWrapper: {
        flex: 1,
        position: "relative",
        marginHorizontal: 4
    },
    input: {
        paddingVertical: 10,
        paddingLeft: 10,
        paddingRight: 25,
        borderRadius: 8,
        borderWidth: 1
    },
    clearButton: {
        position: "absolute",
        right: 10,
        top: 0,
        bottom: 0,
        justifyContent: "center"
    },
    swapButton: {
        padding: 4
    },
    results: {
        maxHeight: 180,
        borderRadius: 8,
        marginTop: 4,
        borderWidth: 1
    },
    resultItem: {
        padding: 8,
        borderBottomWidth: 1
    },
    resultTitle: {
        fontWeight: "600"
    },
    resultAddress: {
        fontSize: 12
    },
    currentLabel: {
        fontSize: 11,
    }
});
