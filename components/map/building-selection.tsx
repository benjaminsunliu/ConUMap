import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import buildingAddressesRaw from "@/data/building-addresses.json";
import { SearchBuilding, FieldType } from "@/types/buildingTypes";

const buildingAddresses = buildingAddressesRaw as SearchBuilding[];

export const CURRENT_LOCATION_CODE = "CURRENT_LOCATION";

const CURRENT_LOCATION_SENTINEL: SearchBuilding = {
  buildingCode: CURRENT_LOCATION_CODE,
  buildingName: "Current Location",
  address: "Your current GPS position",
  campus: "",
};

/**
 * Separates buildings into current and other, returning current buildings first.
 * This prioritizes user's current location in search results.
 */
function prioritizeCurrentBuildings(
  buildings: SearchBuilding[],
  currentCodes: Set<string>,
): SearchBuilding[] {
  const currentBuildings: SearchBuilding[] = [];
  const otherBuildings: SearchBuilding[] = [];

  buildings.forEach((building) => {
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
  readonly hasUserLocation?: boolean;
  readonly mode: "browse" | "directions";
  readonly selectedBuilding: SearchBuilding | null;
  readonly onSelect: (
    buildings: Record<FieldType, SearchBuilding | null>,
    type: FieldType,
  ) => void;
  readonly onSwap?: () => void;
  readonly startOverride?: string | null;
  readonly endOverride?: string | null;
  readonly startHint?: string | null;
}

export default function BuildingSelection({
  currentBuildingCodes = new Set(),
  hasUserLocation = false,
  mode,
  selectedBuilding,
  onSelect,
  onSwap,
  startOverride,
  endOverride,
  startHint,
}: Props) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const [queries, setQueries] = useState<Record<FieldType, string>>({
    start: "",
    end: "",
  });
  const [focusedField, setFocusedField] = useState<FieldType | null>(null);
  const [selectedBuildings, setSelectedBuildings] = useState<
    Record<FieldType, SearchBuilding | null>
  >({
    start: null,
    end: null,
  });

  const selectedBuildingRef = useRef<SearchBuilding | null>(selectedBuilding);
  const selectedBuildingsRef = useRef<Record<FieldType, SearchBuilding | null>>({
    start: null,
    end: null,
  });
  const startInputRef = useRef<TextInput>(null);
  const endInputRef = useRef<TextInput>(null);

  useEffect(() => {
    selectedBuildingsRef.current = selectedBuildings;
  }, [selectedBuildings]);

  useEffect(() => {
    if (mode === "browse") {
      setQueries((prev) => ({ ...prev, end: selectedBuilding?.buildingName ?? "" }));
      setSelectedBuildings((prev) => ({ ...prev, end: selectedBuilding }));
    } else if (
      focusedField === "end" &&
      selectedBuilding &&
      selectedBuilding.buildingCode !== selectedBuildingRef.current?.buildingCode
    ) {
      setQueries((prev) => ({ ...prev, end: selectedBuilding.buildingName }));
      setSelectedBuildings((prev) => ({ ...prev, end: selectedBuilding }));
    } else if (
      focusedField === "start" &&
      selectedBuilding &&
      selectedBuilding.buildingCode !== selectedBuildingRef.current?.buildingCode
    ) {
      setQueries((prev) => ({ ...prev, start: selectedBuilding.buildingName }));
      setSelectedBuildings((prev) => ({ ...prev, start: selectedBuilding }));
    }

    selectedBuildingRef.current = selectedBuilding;
  }, [focusedField, mode, selectedBuilding]);

  useEffect(() => {
    if (startOverride != null) {
      setQueries((prev) => ({ ...prev, start: startOverride }));
      setFocusedField(null);
    }
  }, [startOverride]);

  useEffect(() => {
    if (endOverride != null) {
      setQueries((prev) => ({ ...prev, end: endOverride }));
      setFocusedField(null);
    }
  }, [endOverride]);

  const filterBuildings = useCallback(
    (text: string, fieldType: FieldType) => {
      const q = text.toLowerCase();
      const filtered = buildingAddresses.filter(
        (building) =>
          building.buildingName.toLowerCase().includes(q) ||
          building.buildingCode.toLowerCase().includes(q) ||
          building.address.toLowerCase().includes(q),
      );

      if (fieldType === "start" && currentBuildingCodes.size > 0) {
        return prioritizeCurrentBuildings(filtered, currentBuildingCodes);
      }

      return filtered;
    },
    [currentBuildingCodes],
  );

  const results = useMemo(() => {
    const matchesSentinel = (q: string) =>
      "current location".includes(q) || "my location".includes(q) || "gps".includes(q);

    let startResults: SearchBuilding[];

    if (queries.start) {
      startResults = filterBuildings(queries.start, "start");
      if (hasUserLocation && currentBuildingCodes.size === 0) {
        if (matchesSentinel(queries.start.toLowerCase())) {
          startResults = [CURRENT_LOCATION_SENTINEL, ...startResults];
        }
      }
    } else if (currentBuildingCodes.size > 0) {
      startResults = buildingAddresses.filter((building) =>
        currentBuildingCodes.has(building.buildingCode),
      );
    } else if (hasUserLocation) {
      startResults = [CURRENT_LOCATION_SENTINEL];
    } else {
      startResults = [];
    }

    let endResults: SearchBuilding[];

    if (queries.end) {
      endResults = filterBuildings(queries.end, "end");
      if (hasUserLocation && matchesSentinel(queries.end.toLowerCase())) {
        endResults = [CURRENT_LOCATION_SENTINEL, ...endResults];
      }
    } else if (hasUserLocation && mode === "directions") {
      endResults = [CURRENT_LOCATION_SENTINEL];
    } else {
      endResults = [];
    }

    return { start: startResults, end: endResults };
  }, [queries, filterBuildings, currentBuildingCodes, hasUserLocation, mode]);

  const setQuery = useCallback((type: FieldType, value: string) => {
    setQueries((prev) => ({ ...prev, [type]: value }));
  }, []);

  const handleChange = useCallback(
    (text: string, type: FieldType) => {
      setQuery(type, text);
      setSelectedBuildings((prev) => ({ ...prev, [type]: null }));
    },
    [setQuery],
  );

  const removeInputFocus = useCallback((type: FieldType) => {
    if (type === "start") {
      startInputRef.current?.blur();
    } else {
      endInputRef.current?.blur();
    }
    setFocusedField(null);
  }, []);

  const handleSelect = useCallback(
    (building: SearchBuilding, type: FieldType) => {
      setQuery(type, building.buildingName);
      const updated = { ...selectedBuildingsRef.current, [type]: building };
      setSelectedBuildings(updated);
      onSelect(updated, type);
      removeInputFocus(type);
    },
    [setQuery, removeInputFocus, onSelect],
  );

  const clearField = useCallback(
    (type: FieldType) => {
      setQuery(type, "");
      const updated = { ...selectedBuildingsRef.current, [type]: null };
      setSelectedBuildings(updated);
      onSelect(updated, type);
      removeInputFocus(type);
    },
    [setQuery, removeInputFocus, onSelect],
  );

  const swapFields = useCallback(() => {
    setQueries((prevQueries) => ({
      start: prevQueries.end,
      end: prevQueries.start,
    }));

    const swapped = {
      start: selectedBuildingsRef.current.end,
      end: selectedBuildingsRef.current.start,
    };
    setSelectedBuildings(swapped);

    if (onSwap) {
      onSwap();
    }

    setFocusedField(null);
  }, [onSwap]);

  const renderInput = useCallback(
    (type: FieldType, placeholder: string) => {
      const value = queries[type];
      const hasMagnifier = mode === "browse";

      return (
        <View
          style={[
            { backgroundColor: theme.buildingSelection.inputBackground },
            styles.inputWrapper,
          ]}
        >
          {hasMagnifier && (
            <Ionicons
              name="search"
              size={18}
              color={theme.buildingSelection.magnifierColor}
              style={styles.magnifierIcon}
            />
          )}
          <TextInput
            ref={type === "start" ? startInputRef : endInputRef}
            placeholder={placeholder}
            placeholderTextColor={theme.placeholder}
            value={value}
            onFocus={() => setFocusedField(type)}
            onBlur={() => setFocusedField((prev) => (prev === type ? null : prev))}
            onChangeText={(text) => handleChange(text, type)}
            textAlign="left"
            style={[
              styles.input,
              {
                backgroundColor: theme.buildingSelection.inputBackground,
                borderColor: theme.buildingSelection.borderColor,
                color: theme.buildingSelection.inputText,
                paddingLeft: hasMagnifier ? 0 : 8,
              },
            ]}
          />
          {!!value && (
            <TouchableOpacity
              testID={`clear-${type}`}
              onPress={() => clearField(type)}
              style={styles.clearButton}
            >
              <Text style={{ color: theme.buildingSelection.clearButton, fontSize: 18 }}>
                ×
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [
      queries,
      theme.buildingSelection.inputBackground,
      theme.buildingSelection.magnifierColor,
      theme.buildingSelection.borderColor,
      theme.buildingSelection.inputText,
      theme.buildingSelection.clearButton,
      theme.placeholder,
      mode,
      handleChange,
      clearField,
    ],
  );

  const renderResults = useCallback(
    (type: FieldType) => {
      const data = results[type];
      if (
        !data.length ||
        focusedField !== type ||
        (mode === "browse" && type === "start")
      ) {
        return null;
      }

      return (
        <FlatList
          data={data}
          keyExtractor={(item) => item.buildingCode}
          style={[
            styles.results,
            {
              backgroundColor: theme.background,
              borderColor: theme.buildingInfoPopup.divider,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          testID={`${type}-results`}
          renderItem={({ item }) => {
            const isSentinel = item.buildingCode === CURRENT_LOCATION_CODE;
            const isCurrent = currentBuildingCodes.has(item.buildingCode);
            return (
              <TouchableOpacity
                style={[
                  styles.resultItem,
                  { borderBottomColor: theme.buildingInfoPopup.divider },
                ]}
                onPress={() => handleSelect(item, type)}
                testID={`${type}-result-${item.buildingCode.toUpperCase()}`}
              >
                <Text
                  style={[
                    styles.resultTitle,
                    { color: theme.buildingSelection.resultTitle },
                  ]}
                >
                  {isSentinel ? (
                    "📍 Current Location"
                  ) : (
                    <>
                      {isCurrent && "📍 "}
                      {item.buildingCode} – {item.buildingName}
                      {isCurrent && (
                        <Text style={styles.currentLabel}> (Current Building)</Text>
                      )}
                    </>
                  )}
                </Text>
                {!isSentinel && (
                  <Text style={[styles.resultAddress, { color: theme.text }]}>
                    {item.address}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      );
    },
    [
      results,
      focusedField,
      mode,
      theme.background,
      theme.buildingInfoPopup.divider,
      theme.buildingSelection.resultTitle,
      theme.text,
      currentBuildingCodes,
      handleSelect,
    ],
  );

  return (
    <View style={styles.buildingSelectionContainer} testID="building-selection">
      <View style={styles.inputRow}>
        {mode === "browse" ? (
          renderInput("end", "Search building")
        ) : (
          <View
            style={[
              { backgroundColor: theme.buildingSelection.containerBackground },
              styles.directionContainer,
            ]}
          >
            <View style={styles.icons}>
              <Ionicons
                name="ellipse-outline"
                size={15}
                color={theme.buildingSelection.swapButton}
              />
              <Ionicons
                name="ellipsis-vertical-outline"
                size={20}
                color={theme.buildingSelection.swapButton}
              />
              <Ionicons
                name="ellipsis-vertical-outline"
                size={20}
                color={theme.buildingSelection.swapButton}
              />
              <Ionicons name="pin" size={24} color={theme.buildingSelection.swapButton} />
            </View>
            <View>
              {renderInput("start", "Your location")}
              {!!startHint && (
                <Text
                  style={[
                    styles.startHint,
                    { color: theme.buildingSelection.resultTitle },
                  ]}
                  testID="start-hint"
                >
                  {startHint}
                </Text>
              )}
              {renderInput("end", "Destination")}
            </View>
            <TouchableOpacity
              testID="swap-fields"
              onPress={swapFields}
              style={styles.swapButton}
            >
              <Ionicons
                name="swap-vertical"
                size={24}
                color={theme.buildingSelection.swapButton}
              />
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
    alignItems: "center",
  },
  directionContainer: {
    borderRadius: 16,
    flexDirection: "row",
    width: "95%",
    paddingRight: 40,
    paddingLeft: 10,
    paddingBottom: 10,
    borderWidth: 1.5,
    marginTop: 10,
  },
  buildingSelectionContainer: {
    position: "absolute",
    width: "100%",
    zIndex: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "100%",
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
    paddingRight: "8%",
    minHeight: Platform.OS === "ios" ? 38 : undefined,
    paddingVertical: Platform.OS === "ios" ? 4 : 0,
  },
  input: {
    paddingRight: "10%",
    width: "100%",
    textAlign: "left",
  },
  clearButton: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  swapButton: {
    justifyContent: "center",
    paddingRight: "5%",
    paddingLeft: "0%",
    marginLeft: "0%",
  },
  results: {
    maxHeight: 180,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
  },
  resultItem: {
    padding: 8,
    borderBottomWidth: 1,
  },
  resultTitle: {
    fontWeight: "600",
  },
  resultAddress: {
    fontSize: 12,
  },
  currentLabel: {
    fontSize: 11,
  },
  startHint: {
    fontSize: 12,
    marginLeft: 6,
    marginBottom: 2,
  },
  magnifierIcon: {
    marginRight: 10,
    marginLeft: 10,
  },
});
