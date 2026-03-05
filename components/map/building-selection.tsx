import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import buildingAddressesRaw from "@/data/building-addresses.json";
import { SearchBuilding, FieldType } from "@/types/buildingTypes";

const buildingAddresses = buildingAddressesRaw as SearchBuilding[];

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
    readonly mode: "browse" | "directions";
    readonly selectedBuilding: SearchBuilding | null;
    readonly onSelect: (buildings: Record<FieldType, SearchBuilding | null>, type: FieldType) => void;
}

export default function BuildingSelection({ currentBuildingCodes = new Set(), mode, selectedBuilding, onSelect }: Props) {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme];
    const [queries, setQueries] = useState<Record<FieldType, string>>({ start: "", end: "" });
    const [focusedField, setFocusedField] = useState<FieldType | null>(null);
    const [selectedBuildings, setSelectedBuildings] = useState<Record<FieldType, SearchBuilding | null>>({
        start: null,
        end: null
    });
    const selectedBuildingRef = useRef(selectedBuilding);
    const startInputRef = useRef<TextInput>(null);
    const endInputRef = useRef<TextInput>(null);
    const focusRef = useRef<FieldType>(focusedField);

    useEffect(() => {

        // Always have the search bar reflect the currently selected building
        if (mode === "browse") {
            setQueries(prev => ({ ...prev, end: selectedBuilding?.buildingName ?? "" }));
        }
        // Edge case where they selected a building in the start search bar
        else if (focusedField === null && focusRef.current !== focusedField && selectedBuilding && selectedBuilding !== selectedBuildingRef.current) {
            const previousFocus = focusRef.current === "end" ? "end" : "start";
            setQueries(prev => ({ ...prev, [previousFocus]: selectedBuilding.buildingName }));
            setSelectedBuildings(prev => ({ ...prev, [previousFocus]: selectedBuilding }));
        }
        // Only change the text field value if the selected building changes when the field is focused
        else if (focusedField === "end" && selectedBuilding && selectedBuilding !== selectedBuildingRef.current) {
            setQueries(prev => ({ ...prev, end: selectedBuilding.buildingName }));
            setSelectedBuildings(prev => ({ ...prev, end: selectedBuilding }));
        } else if (focusedField === "start" && selectedBuilding && selectedBuilding !== selectedBuildingRef.current) {
            setQueries(prev => ({ ...prev, start: selectedBuilding.buildingName }));
            setSelectedBuildings(prev => ({ ...prev, start: selectedBuilding }));
        }
        selectedBuildingRef.current = selectedBuilding;
    }, [focusedField, mode, selectedBuilding]);

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
            setSelectedBuildings(prev => ({ ...prev, [type]: null }));
        },
        [setQuery]
    );

    const removeInputFocus = useCallback(
        (type: FieldType) => {
            if (type === "start") {
                startInputRef.current?.blur();
            } else {
                endInputRef.current?.blur();
            }
            setFocusedField(null);
        },
        []
    );

    const handleSelect = useCallback(
        (building: SearchBuilding, type: FieldType) => {
            setQuery(type, building.buildingName);
            setSelectedBuildings(prev => ({ ...prev, [type]: building }));
            onSelect({ ...selectedBuildings, [type]: building }, type);
            removeInputFocus(type);
        },
        [setQuery, removeInputFocus, onSelect, selectedBuildings]
    );

    const clearField = useCallback(
        (type: FieldType) => {
            setQuery(type, "");
            setSelectedBuildings(prev => ({ ...prev, [type]: null }));
            onSelect({ ...selectedBuildings, [type]: null }, type);
            removeInputFocus(type);
        },
        [setQuery, removeInputFocus, onSelect, selectedBuildings]
    );

    const swapFields = useCallback(() => {
        setQueries(prevQueries => {
            setSelectedBuildings(prevBuildings => {
                const swappedBuildings = {
                    start: prevBuildings.end,
                    end: prevBuildings.start
                };
                return swappedBuildings;
            });

            onSelect({ start: selectedBuildings.end, end: selectedBuildings.start }, "end");

            return {
                start: prevQueries.end,
                end: prevQueries.start
            };
        });

        setFocusedField(null);
    }, [onSelect, selectedBuildings]);

    const renderInput = useCallback(
        (type: FieldType, placeholder: string) => {
            const value = queries[type];

            return (
                <View style={[{ backgroundColor: theme.buildingSelection.inputBackground }, styles.inputWrapper]}>
                    {mode === "browse" && (
                        <Ionicons name="search" size={18} color={theme.buildingSelection.magnifierColor} style={styles.magnifierIcon} />
                    )}
                    <TextInput
                        ref={type === "start" ? startInputRef : endInputRef}
                        placeholder={placeholder}
                        placeholderTextColor={theme.placeholder}
                        value={value}
                        onFocus={() => setFocusedField(type)}
                        onBlur={() => setFocusedField(prev => (prev === type ? null : prev))}
                        onChangeText={t => handleChange(t, type)}
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.buildingSelection.inputBackground,
                                borderColor: theme.buildingSelection.borderColor,
                                color: theme.buildingSelection.inputText
                            }
                        ]}
                    />
                    {!!value && (
                        <TouchableOpacity testID={`clear-${type}`} onPress={() => clearField(type)} style={styles.clearButton}>
                            <Text style={{ color: theme.buildingSelection.clearButton, fontSize: 18 }}>×</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }, [queries, theme.text, handleChange, clearField, mode, theme.buildingSelection.borderColor, theme.buildingSelection.clearButton, theme.buildingSelection.inputBackground, theme.buildingSelection.inputText, theme.buildingSelection.magnifierColor]
    );

    const renderResults = useCallback(
        (type: FieldType) => {
            const data = results[type];
            if (!data.length || focusedField !== type || mode === "browse" && type === "start") return null;

            return (
                <FlatList
                    data={data}
                    keyExtractor={i => i.buildingCode}
                    style={[styles.results, { backgroundColor: theme.background, borderColor: theme.buildingInfoPopup.divider }]}
                    keyboardShouldPersistTaps="handled"
                    testID={`${type}-results`}
                    renderItem={({ item }) => {
                        const isCurrent = currentBuildingCodes.has(item.buildingCode);
                        return (
                            <TouchableOpacity
                                style={[styles.resultItem, { borderBottomColor: theme.buildingInfoPopup.divider }]}
                                onPress={() => handleSelect(item, type)}
                                testID={`${type}-result-${item.buildingCode.toUpperCase()}`}>
                                <Text style={[styles.resultTitle, { color: theme.buildingSelection.resultTitle }]}>
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
        [mode, results, focusedField, theme.background, theme.buildingInfoPopup.divider, theme.campusToggle.selectedColor, theme.text, handleSelect, currentBuildingCodes]
    );

    return (
        <View style={styles.buildingSelectionContainer} testID="building-selection">
            <View style={styles.inputRow}>
                {mode === "browse" ? (renderInput("end", "Search building")) : (
                    <View style={[{ backgroundColor: theme.buildingSelection.containerBackground }, styles.directionContainer]}>
                        <View style={styles.icons}>
                            <Ionicons name="ellipse-outline" size={15} color={theme.buildingSelection.swapButton} />
                            <Ionicons name="ellipsis-vertical-outline" size={20} color={theme.buildingSelection.swapButton} />
                            <Ionicons name="ellipsis-vertical-outline" size={20} color={theme.buildingSelection.swapButton} />
                            <Ionicons name="pin" size={24} color={theme.buildingSelection.swapButton} />
                        </View>
                        <View>
                            {renderInput("start", "Your location")}
                            {renderInput("end", "Destination")}
                        </View>
                        <TouchableOpacity testID="swap-fields" onPress={swapFields} style={styles.swapButton}>
                            <Ionicons name="swap-vertical" size={24} color={theme.buildingSelection.swapButton} />
                        </TouchableOpacity>

                    </View>
                )}
            </View>
            {renderResults("start")}
            {renderResults("end")}
        </View>
    );
}

const styles = StyleSheet.create({
    icons: {
        position: "relative",
        paddingTop: "5%",
        flexDirection: "column",
        alignSelf: "center",
        alignItems: "center"
    },
    directionContainer: {
        borderRadius: 16,
        flexDirection: "row",
        width: "95%",
        paddingRight: 40,
        paddingLeft: 10,
        paddingBottom: 10,
        borderWidth: 1.5,
        marginTop: 10
    },
    buildingSelectionContainer: {
        position: "absolute",
        width: "100%",
        zIndex: 10
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: "100%"
    },
    inputWrapper: {
        flex: 1,
        marginHorizontal: 4,
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 16,
        maxWidth: "95%",
        overflow: "hidden",
        paddingRight: "8%"
    },
    input: {
        paddingRight: "10%",
        width: "100%"
    },
    clearButton: {
        position: "absolute",
        right: 10,
        top: 0,
        bottom: 0,
        justifyContent: "center"
    },
    swapButton: {
        justifyContent: "center",
        paddingRight: "5%",
        paddingLeft: "0%",
        marginLeft: "0%"
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
    },
    magnifierIcon: {
        marginRight: 10,
        marginLeft: 10,
    }
});
