import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { SearchBuilding, FieldType } from "@/types/buildingTypes";
import { useBuildingSearch, CURRENT_LOCATION_CODE } from "@/hooks/use-search-building";

type SearchInput = Record<FieldType, SearchBuilding | null>;
interface Props {
  readonly currentBuildingCodes?: Set<string>;
  readonly hasUserLocation?: boolean;
  readonly mode: "browse" | "directions";
  readonly selectedBuilding?: SearchBuilding | null;
  readonly onSelect: (buildings: SearchInput, type: FieldType) => void;
  readonly onSwap?: () => void;
  readonly onFocusChange?: (isFocused: boolean) => void;
  readonly startOverride?: string | null;
  readonly endOverride?: string | null;
  readonly startHint?: string | null;
}

const getSelectionDisplayLabel = (selection: SearchBuilding) => {
  if (selection.buildingCode === CURRENT_LOCATION_CODE) {
    return "Current Location";
  }

  const roomLabel = (selection.roomName ?? "").trim();
  if (selection.isIndoorRoom && roomLabel) {
    return roomLabel;
  }

  return selection.buildingName;
};

type UpdateQuery = (type: FieldType, value: string) => void;
type SetSelectedBuildings = Dispatch<SetStateAction<SearchInput>>;

const isWeb = Platform.OS === "web";

function shouldPreserveRoomSelection(
  currentSelection: SearchBuilding | null | undefined,
  selectedBuilding: SearchBuilding,
) {
  return Boolean(
    currentSelection?.isIndoorRoom &&
    currentSelection.parentBuildingCode === selectedBuilding.buildingCode,
  );
}

function getPreservedSelectionLabel(selection: SearchBuilding | null | undefined) {
  return selection?.roomName ?? selection?.buildingName ?? "";
}

function syncBrowseSelection({
  selectedBuilding,
  previousSelectedBuilding,
  currentEndSelection,
  updateQuery,
  setSelectedBuildings,
}: {
  selectedBuilding?: SearchBuilding | null;
  previousSelectedBuilding?: SearchBuilding | null;
  currentEndSelection: SearchBuilding | null;
  updateQuery: UpdateQuery;
  setSelectedBuildings: SetSelectedBuildings;
}) {
  if (selectedBuilding) {
    if (shouldPreserveRoomSelection(currentEndSelection, selectedBuilding)) {
      updateQuery("end", getPreservedSelectionLabel(currentEndSelection));
      return;
    }

    updateQuery("end", selectedBuilding.buildingName);
    setSelectedBuildings((prev) => ({ ...prev, end: selectedBuilding }));
    return;
  }

  if (selectedBuilding !== previousSelectedBuilding) {
    updateQuery("end", "");
    setSelectedBuildings((prev) => ({ ...prev, end: null }));
  }
}

function syncFocusedSelection({
  field,
  selectedBuilding,
  currentSelection,
  updateQuery,
  setSelectedBuildings,
}: {
  field: FieldType | null;
  selectedBuilding?: SearchBuilding | null;
  currentSelection: SearchBuilding | null;
  updateQuery: UpdateQuery;
  setSelectedBuildings: SetSelectedBuildings;
}) {
  if (!field || !selectedBuilding) {
    return;
  }

  if (shouldPreserveRoomSelection(currentSelection, selectedBuilding)) {
    updateQuery(field, getPreservedSelectionLabel(currentSelection));
    return;
  }

  updateQuery(field, selectedBuilding.buildingName);
  setSelectedBuildings((prev) => ({ ...prev, [field]: selectedBuilding }));
}

function getSearchResultLabel(item: SearchBuilding) {
  if (item.isIndoorRoom && item.parentBuildingCode) {
    return `${item.parentBuildingCode} – ${item.roomName ?? item.buildingName}`;
  }

  return `${item.buildingCode} – ${item.buildingName}`;
}

export default function BuildingSelection({
  currentBuildingCodes = new Set(),
  hasUserLocation = false,
  mode,
  selectedBuilding,
  onSelect,
  onSwap,
  onFocusChange,
  startOverride,
  endOverride,
  startHint,
}: Props) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { width: windowWidth } = useWindowDimensions();
  const shouldUseHorizontalWebDirectionsLayout =
    isWeb && mode === "directions" && windowWidth >= 1100;
  const shouldUseStackedWebDirectionsLayout =
    isWeb && mode === "directions" && !shouldUseHorizontalWebDirectionsLayout;

  const { queries, updateQuery, swapQueries, results } = useBuildingSearch({
    currentBuildingCodes,
    hasUserLocation,
  });

  const [focusedField, setFocusedField] = useState<FieldType | null>(null);
  const [selectedBuildings, setSelectedBuildings] = useState<SearchInput>({
    start: null,
    end: null,
  });

  const startInputRef = useRef<TextInput>(null);
  const endInputRef = useRef<TextInput>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSelectionPressRef = useRef<{
    type: FieldType;
    buildingCode: string;
    timestamp: number;
  } | null>(null);
  const selectedBuildingsRef = useRef(selectedBuildings);
  const selectedBuildingRef = useRef(selectedBuilding);
  const suppressSelectionChangeRef = useRef<Record<FieldType, boolean>>({
    start: false,
    end: false,
  });

  const clearBlurTimeout = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const scheduleBlur = useCallback(
    (field: FieldType) => {
      clearBlurTimeout();
      blurTimeoutRef.current = setTimeout(() => {
        setFocusedField((prev) => (prev === field ? null : prev));
      }, 120);
    },
    [clearBlurTimeout],
  );

  const removeInputFocus = useCallback(
    (type: FieldType) => {
      clearBlurTimeout();
      if (type === "start") {
        startInputRef.current?.blur();
      } else {
        endInputRef.current?.blur();
      }
      setFocusedField(null);
    },
    [clearBlurTimeout],
  );

  useEffect(() => {
    return () => {
      clearBlurTimeout();
    };
  }, [clearBlurTimeout]);

  useEffect(() => {
    if (startOverride !== undefined) updateQuery("start", startOverride ?? "");
  }, [startOverride, updateQuery]);

  useEffect(() => {
    if (endOverride !== undefined) updateQuery("end", endOverride ?? "");
  }, [endOverride, updateQuery]);

  const handleChange = useCallback(
    (text: string, type: FieldType) => {
      if (suppressSelectionChangeRef.current[type]) {
        suppressSelectionChangeRef.current[type] = false;
        return;
      }
      updateQuery(type, text);
      setSelectedBuildings((prev) => ({ ...prev, [type]: null }));
    },
    [updateQuery],
  );

  const handleSelect = useCallback(
    (building: SearchBuilding, type: FieldType) => {
      const now = Date.now();
      const lastSelection = lastSelectionPressRef.current;
      if (
        lastSelection &&
        lastSelection.type === type &&
        lastSelection.buildingCode === building.buildingCode &&
        now - lastSelection.timestamp < 250
      ) {
        return;
      }

      lastSelectionPressRef.current = {
        type,
        buildingCode: building.buildingCode,
        timestamp: now,
      };

      clearBlurTimeout();
      suppressSelectionChangeRef.current[type] = true;
      updateQuery(type, getSelectionDisplayLabel(building));
      const updated = { ...selectedBuildingsRef.current, [type]: building };
      setSelectedBuildings(updated);
      onSelect(updated, type);
      removeInputFocus(type);
    },
    [clearBlurTimeout, updateQuery, onSelect, removeInputFocus],
  );

  const clearField = useCallback(
    (type: FieldType) => {
      suppressSelectionChangeRef.current[type] = false;
      updateQuery(type, "");
      const updated = { ...selectedBuildingsRef.current, [type]: null };
      setSelectedBuildings(updated);
      onSelect(updated, type);
      removeInputFocus(type);
    },
    [updateQuery, onSelect, removeInputFocus],
  );

  const swapFields = useCallback(() => {
    suppressSelectionChangeRef.current = {
      start: false,
      end: false,
    };
    swapQueries();
    const swapped = {
      start: selectedBuildingsRef.current.end,
      end: selectedBuildingsRef.current.start,
    };
    setSelectedBuildings(swapped);
    if (onSwap) onSwap();
    setFocusedField(null);
  }, [onSwap, swapQueries]);

  useEffect(() => {
    selectedBuildingsRef.current = selectedBuildings;
  }, [selectedBuildings]);
  useEffect(() => {
    const previousSelectedBuilding = selectedBuildingRef.current;

    if (mode === "browse") {
      syncBrowseSelection({
        selectedBuilding,
        previousSelectedBuilding,
        currentEndSelection: selectedBuildingsRef.current.end,
        updateQuery,
        setSelectedBuildings,
      });
      selectedBuildingRef.current = selectedBuilding;
      return;
    }

    if (selectedBuilding !== previousSelectedBuilding) {
      syncFocusedSelection({
        field: focusedField,
        selectedBuilding,
        currentSelection: focusedField
          ? selectedBuildingsRef.current[focusedField]
          : null,
        updateQuery,
        setSelectedBuildings,
      });
    }

    selectedBuildingRef.current = selectedBuilding;
  }, [focusedField, mode, selectedBuilding, updateQuery]);

  useEffect(() => {
    onFocusChange?.(focusedField !== null);
  }, [focusedField, onFocusChange]);

  const renderInput = useCallback(
    (
      type: FieldType,
      placeholder: string,
      options?: {
        inputWrapperStyle?: StyleProp<ViewStyle>;
      },
    ) => {
      const value = queries[type] || "";
      const hasMagnifier = mode === "browse";

      return (
        <View
          style={[
            { backgroundColor: theme.buildingSelection.inputBackground },
            styles.inputWrapper,
            shouldUseStackedWebDirectionsLayout && styles.inputWrapperStackedWeb,
            options?.inputWrapperStyle,
          ]}
        >
          {hasMagnifier && (
            <Ionicons
              name="search"
              size={isWeb ? 21 : 18}
              color={theme.buildingSelection.magnifierColor}
              style={styles.magnifierIcon}
            />
          )}
          <TextInput
            ref={type === "start" ? startInputRef : endInputRef}
            key={type}
            placeholder={placeholder}
            placeholderTextColor={theme.placeholder}
            value={value}
            onFocus={() => {
              clearBlurTimeout();
              suppressSelectionChangeRef.current[type] = false;
              setFocusedField(type);
            }}
            onBlur={() => {
              const shouldDelayBlur =
                mode === "browse" || (mode === "directions" && results[type].length > 0);
              if (shouldDelayBlur) {
                scheduleBlur(type);
                return;
              }
              setFocusedField((prev) => (prev === type ? null : prev));
            }}
            onChangeText={(text) => handleChange(text, type)}
            textAlign="left"
            style={[
              styles.input,
              shouldUseStackedWebDirectionsLayout && styles.inputStackedWeb,
              {
                backgroundColor: theme.buildingSelection.inputBackground,
                borderColor: theme.buildingSelection.borderColor,
                color: theme.buildingSelection.inputText,
                fontSize: shouldUseStackedWebDirectionsLayout ? 16 : isWeb ? 18 : 16,
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
              <Ionicons
                name="close-circle"
                size={isWeb ? 20 : 18}
                color={theme.buildingSelection.clearButton}
              />
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [
      queries,
      mode,
      results,
      theme.buildingSelection.inputBackground,
      theme.buildingSelection.magnifierColor,
      theme.buildingSelection.borderColor,
      theme.buildingSelection.inputText,
      theme.buildingSelection.clearButton,
      theme.placeholder,
      clearBlurTimeout,
      scheduleBlur,
      handleChange,
      clearField,
      shouldUseStackedWebDirectionsLayout,
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
            const resultLabel = getSearchResultLabel(item);
            return (
              <TouchableOpacity
                style={[
                  styles.resultItem,
                  { borderBottomColor: theme.buildingInfoPopup.divider },
                ]}
                onPressIn={() => handleSelect(item, type)}
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
                    "• Current Location"
                  ) : (
                    <>
                      {isCurrent && "• "}
                      {resultLabel}
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
              shouldUseHorizontalWebDirectionsLayout &&
              styles.directionContainerHorizontal,
              shouldUseStackedWebDirectionsLayout && styles.directionContainerStackedWeb,
            ]}
          >
            <View
              style={[
                styles.icons,
                shouldUseHorizontalWebDirectionsLayout && styles.iconsHorizontal,
                shouldUseStackedWebDirectionsLayout && styles.iconsStackedWeb,
              ]}
            >
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
            <View
              style={[
                styles.directionFields,
                shouldUseHorizontalWebDirectionsLayout &&
                styles.directionFieldsHorizontal,
              ]}
            >
              <View
                style={[
                  styles.directionFieldGroup,
                  shouldUseHorizontalWebDirectionsLayout &&
                  styles.directionFieldGroupHorizontal,
                ]}
              >
                {renderInput(
                  "start",
                  "Your location",
                  shouldUseHorizontalWebDirectionsLayout
                    ? { inputWrapperStyle: styles.inputWrapperHorizontal }
                    : undefined,
                )}
                {shouldUseHorizontalWebDirectionsLayout ? (
                  <View style={styles.hintSlotHorizontal}>
                    {!!startHint && (
                      <Text
                        style={[
                          styles.startHint,
                          styles.startHintHorizontal,
                          { color: theme.buildingSelection.resultTitle },
                        ]}
                        testID="start-hint"
                      >
                        {startHint}
                      </Text>
                    )}
                  </View>
                ) : (
                  !!startHint && (
                    <Text
                      style={[
                        styles.startHint,
                        shouldUseStackedWebDirectionsLayout &&
                        styles.startHintStackedWeb,
                        { color: theme.buildingSelection.resultTitle },
                      ]}
                      testID="start-hint"
                    >
                      {startHint}
                    </Text>
                  )
                )}
              </View>
              <TouchableOpacity
                testID="swap-fields"
                onPress={swapFields}
                style={[
                  styles.swapButton,
                  shouldUseHorizontalWebDirectionsLayout && styles.swapButtonHorizontal,
                  shouldUseStackedWebDirectionsLayout && styles.swapButtonStackedWeb,
                ]}
              >
                <Ionicons
                  name="swap-vertical"
                  size={24}
                  color={theme.buildingSelection.swapButton}
                />
              </TouchableOpacity>
              <View
                style={[
                  styles.directionFieldGroup,
                  shouldUseHorizontalWebDirectionsLayout &&
                  styles.directionFieldGroupHorizontal,
                ]}
              >
                {renderInput(
                  "end",
                  "Destination",
                  shouldUseHorizontalWebDirectionsLayout
                    ? { inputWrapperStyle: styles.inputWrapperHorizontal }
                    : undefined,
                )}
                {shouldUseHorizontalWebDirectionsLayout ? (
                  <View style={styles.hintSlotHorizontal} />
                ) : null}
              </View>
            </View>
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
    borderRadius: isWeb ? 18 : 16,
    flexDirection: "row",
    width: "95%",
    paddingRight: 40,
    paddingLeft: 10,
    paddingBottom: isWeb ? 10 : 10,
    borderWidth: 1.5,
    marginTop: isWeb ? 12 : 10,
  },
  directionContainerHorizontal: {
    alignItems: "center",
    paddingRight: 18,
    paddingLeft: 14,
    paddingTop: 6,
    paddingBottom: 8,
  },
  directionContainerStackedWeb: {
    marginTop: 8,
    paddingRight: 24,
    paddingLeft: 8,
    paddingBottom: 6,
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
    marginTop: isWeb ? 12 : 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: isWeb ? 18 : 16,
    maxWidth: "95%",
    overflow: "hidden",
    paddingRight: "8%",
    minHeight: isWeb ? 44 : Platform.OS === "ios" ? 38 : undefined,
    paddingVertical: isWeb ? 4 : Platform.OS === "ios" ? 4 : 0,
  },
  inputWrapperHorizontal: {
    maxWidth: "100%",
    marginTop: 0,
    marginHorizontal: 0,
  },
  inputWrapperStackedWeb: {
    marginTop: 8,
    minHeight: 38,
    paddingVertical: 2,
  },
  input: {
    paddingRight: "10%",
    width: "100%",
    textAlign: "left",
    minHeight: isWeb ? 44 : undefined,
  },
  inputStackedWeb: {
    minHeight: 38,
  },
  directionFields: {
    flex: 1,
  },
  directionFieldsHorizontal: {
    flexDirection: "row",
    alignItems: "center",
  },
  directionFieldGroup: {
    flexShrink: 1,
  },
  directionFieldGroupHorizontal: {
    flex: 1,
    minWidth: 0,
    paddingTop: 8,
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
  swapButtonHorizontal: {
    paddingHorizontal: 14,
    paddingRight: 14,
    alignSelf: "center",
    marginTop: 4,
  },
  swapButtonStackedWeb: {
    paddingTop: 4,
    paddingBottom: 0,
  },
  results: {
    maxHeight: 180,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
  },
  resultItem: {
    padding: isWeb ? 10 : 8,
    borderBottomWidth: 1,
  },
  resultTitle: {
    fontWeight: "600",
    fontSize: isWeb ? 15 : 14,
  },
  resultAddress: {
    fontSize: isWeb ? 13 : 12,
  },
  currentLabel: {
    fontSize: 11,
  },
  startHint: {
    fontSize: isWeb ? 13 : 12,
    marginLeft: 6,
    marginBottom: 2,
  },
  startHintStackedWeb: {
    fontSize: 12,
    marginBottom: 0,
  },
  startHintHorizontal: {
    marginLeft: 2,
    marginTop: 2,
    marginBottom: 0,
  },
  hintSlotHorizontal: {
    minHeight: 20,
    justifyContent: "flex-start",
  },
  magnifierIcon: {
    marginRight: isWeb ? 12 : 10,
    marginLeft: isWeb ? 12 : 10,
  },
  iconsHorizontal: {
    paddingTop: 0,
    marginRight: 10,
  },
  iconsStackedWeb: {
    paddingTop: 0,
  },
});
