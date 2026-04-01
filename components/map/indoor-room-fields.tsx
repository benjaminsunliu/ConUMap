import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RoomFieldType = "start" | "end";

interface IndoorRoomFieldsProps {
  buildingCode: string;
  startRoom: string;
  endRoom: string;
  roomSuggestions?: string[];
  canCreatePath?: boolean;
  onChangeStartRoom: (value: string) => void;
  onChangeEndRoom: (value: string) => void;
  onCreatePath: () => void;
  routeError?: string;
}

export default function IndoorRoomFields({
  buildingCode,
  startRoom,
  endRoom,
  roomSuggestions = [],
  canCreatePath = true,
  onChangeStartRoom,
  onChangeEndRoom,
  onCreatePath,
  routeError,
}: Readonly<IndoorRoomFieldsProps>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = makeStyles(theme);
  const startInputRef = useRef<TextInput>(null);
  const endInputRef = useRef<TextInput>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusedField, setFocusedField] = useState<RoomFieldType | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<Record<RoomFieldType, string>>({
    start: "",
    end: "",
  });

  const clearBlurTimeout = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const scheduleBlur = useCallback(
    (field: RoomFieldType) => {
      clearBlurTimeout();
      blurTimeoutRef.current = setTimeout(() => {
        setFocusedField((prev) => (prev === field ? null : prev));
      }, 120);
    },
    [clearBlurTimeout],
  );

  useEffect(() => {
    return () => {
      clearBlurTimeout();
    };
  }, [clearBlurTimeout]);

  const startSuggestions = useMemo(
    () => filterRoomSuggestions(roomSuggestions, startRoom, buildingCode),
    [roomSuggestions, startRoom, buildingCode],
  );
  const endSuggestions = useMemo(
    () => filterRoomSuggestions(roomSuggestions, endRoom, buildingCode),
    [roomSuggestions, endRoom, buildingCode],
  );
  const activeField = focusedField;
  const activeQuery = getActiveRoomQuery(activeField, startRoom, endRoom);
  const selectedRoomForField = getSelectedRoomForField(activeField, selectedRooms);
  const activeSuggestions = getActiveSuggestions(activeField, startSuggestions, endSuggestions);
  const suggestionField = getSuggestionField(
    activeField,
    activeQuery,
    selectedRoomForField,
    activeSuggestions,
  );

  const dismissSuggestions = useCallback(() => {
    clearBlurTimeout();
    setFocusedField(null);
    startInputRef.current?.blur();
    endInputRef.current?.blur();
    Keyboard.dismiss();
  }, [clearBlurTimeout]);

  const handleStartFocus = useCallback(() => {
    clearBlurTimeout();
    setFocusedField("start");
  }, [clearBlurTimeout]);

  const handleEndFocus = useCallback(() => {
    clearBlurTimeout();
    setFocusedField("end");
  }, [clearBlurTimeout]);

  const handleSelectSuggestion = useCallback(
    (field: RoomFieldType, room: string) => {
      clearBlurTimeout();
      if (field === "start") {
        onChangeStartRoom(room);
        setSelectedRooms((prev) => ({ ...prev, start: room }));
        startInputRef.current?.blur();
      } else {
        onChangeEndRoom(room);
        setSelectedRooms((prev) => ({ ...prev, end: room }));
        endInputRef.current?.blur();
      }
      setFocusedField(null);
    },
    [clearBlurTimeout, onChangeStartRoom, onChangeEndRoom],
  );

  const handleChangeStart = useCallback(
    (value: string) => {
      onChangeStartRoom(value);
      setSelectedRooms((prev) =>
        normalizeSearchToken(value) === normalizeSearchToken(prev.start)
          ? prev
          : { ...prev, start: "" },
      );
    },
    [onChangeStartRoom],
  );

  const handleChangeEnd = useCallback(
    (value: string) => {
      onChangeEndRoom(value);
      setSelectedRooms((prev) =>
        normalizeSearchToken(value) === normalizeSearchToken(prev.end)
          ? prev
          : { ...prev, end: "" },
      );
    },
    [onChangeEndRoom],
  );

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {suggestionField ? (
        <TouchableOpacity
          testID="indoor-room-suggestions-dismiss-overlay"
          style={styles.dismissOverlay}
          activeOpacity={1}
          onPress={dismissSuggestions}
        />
      ) : null}

      <View style={styles.container}>
        <View style={styles.panel}>
          <Text style={styles.title}>Indoor Route</Text>

          <View style={styles.fieldsRow}>
            <View style={styles.field}>
              <Ionicons
                name="navigate-outline"
                size={16}
                color={theme.floorSelection.chevron}
              />
              <TextInput
                ref={startInputRef}
                testID="indoor-start-room-input"
                value={startRoom}
                onChangeText={handleChangeStart}
                placeholder={`Start (${buildingCode}820)`}
                placeholderTextColor={theme.placeholder}
                style={styles.input}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="next"
                onFocus={handleStartFocus}
                onBlur={() => scheduleBlur("start")}
                onSubmitEditing={() => endInputRef.current?.focus()}
              />
              {startRoom ? (
                <TouchableOpacity
                  testID="indoor-clear-start-room"
                  onPress={() => {
                    onChangeStartRoom("");
                    setSelectedRooms((prev) => ({ ...prev, start: "" }));
                  }}
                  style={styles.clearFieldButton}
                >
                  <Text style={styles.clearFieldButtonText}>×</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.field}>
              <Ionicons
                name="flag-outline"
                size={16}
                color={theme.floorSelection.chevron}
              />
              <TextInput
                ref={endInputRef}
                testID="indoor-end-room-input"
                value={endRoom}
                onChangeText={handleChangeEnd}
                placeholder={`End (${buildingCode}838)`}
                placeholderTextColor={theme.placeholder}
                style={styles.input}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onFocus={handleEndFocus}
                onBlur={() => scheduleBlur("end")}
                onSubmitEditing={() => {
                  if (canCreatePath) {
                    onCreatePath();
                  }
                }}
              />
              {endRoom ? (
                <TouchableOpacity
                  testID="indoor-clear-end-room"
                  onPress={() => {
                    onChangeEndRoom("");
                    setSelectedRooms((prev) => ({ ...prev, end: "" }));
                  }}
                  style={styles.clearFieldButton}
                >
                  <Text style={styles.clearFieldButtonText}>×</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {suggestionField ? (
            <View
              style={styles.suggestionsContainer}
              testID={`indoor-${suggestionField}-room-suggestions`}
            >
              <FlatList
                data={activeSuggestions}
                keyExtractor={(item) => `${suggestionField}-${item}`}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.suggestionItem,
                      { borderBottomColor: theme.floorSelection.separator },
                    ]}
                    onPress={() => handleSelectSuggestion(suggestionField, item)}
                    testID={`indoor-${suggestionField}-room-suggestion-${formatSuggestionTestId(item)}`}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          ) : null}

          <TouchableOpacity
            testID="indoor-create-path-button"
            style={[styles.routeButton, !canCreatePath && styles.routeButtonDisabled]}
            onPress={onCreatePath}
            activeOpacity={canCreatePath ? 0.85 : 1}
            disabled={!canCreatePath}
          >
            <Text style={styles.routeButtonText}>Navigate</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.mapSettings.fabBackground} />
          </TouchableOpacity>

          {routeError ? <Text style={styles.errorText}>{routeError}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    overlayContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 11,
    },
    dismissOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    container: {
      position: "absolute",
      top: "2%",
      alignSelf: "center",
      width: "68%",
      maxWidth: 360,
      minWidth: 240,
    },
    panel: {
      backgroundColor: theme.floorSelection.buttonBackground,
      borderRadius: 16,
      padding: 8,
      elevation: 6,
      gap: 6,
    },
    title: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.floorSelection.textColor,
    },
    fieldsRow: {
      flexDirection: "row",
      gap: 6,
    },
    field: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 10,
      paddingHorizontal: 7,
      borderWidth: 1,
      borderColor: theme.floorSelection.separator,
      backgroundColor: theme.buildingSelection.inputBackground,
    },
    input: {
      flex: 1,
      color: theme.buildingSelection.inputText,
      fontSize: 12,
      fontWeight: "500",
      paddingVertical: 6,
    },
    suggestionsContainer: {
      maxHeight: 96,
      borderWidth: 1,
      borderColor: theme.floorSelection.separator,
      borderRadius: 10,
      backgroundColor: theme.buildingSelection.inputBackground,
      overflow: "hidden",
    },
    suggestionItem: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderBottomWidth: 1,
    },
    suggestionText: {
      color: theme.buildingSelection.inputText,
      fontSize: 12,
      fontWeight: "500",
    },
    clearFieldButton: {
      paddingLeft: 4,
      paddingRight: 2,
      paddingVertical: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    clearFieldButtonText: {
      color: theme.buildingSelection.inputText,
      fontSize: 15,
      lineHeight: 15,
      fontWeight: "600",
    },
    routeButton: {
      marginTop: 1,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: theme.mapSettings.fabIcon,
      paddingVertical: 7,
    },
    routeButtonDisabled: {
      opacity: 0.45,
    },
    routeButtonText: {
      color: theme.mapSettings.fabBackground,
      fontWeight: "700",
      fontSize: 12,
    },
    errorText: {
      color: "#b00020",
      fontSize: 11,
      fontWeight: "500",
    },
  });

function filterRoomSuggestions(roomSuggestions: string[], query: string, buildingCode: string) {
  const normalizedSuggestions = [...new Set(roomSuggestions.map((room) => room.trim()))].filter(
    Boolean,
  );
  if (normalizedSuggestions.length === 0) {
    return [];
  }

  const roomQueryTokens = getRoomSearchTokens(query, buildingCode);
  if (roomQueryTokens.length === 0) {
    return [];
  }

  return normalizedSuggestions
    .map((room) => {
      const roomTokens = getRoomTokens(room, buildingCode);
      const matchIndexes = roomQueryTokens.flatMap((queryToken) =>
        roomTokens
          .map((roomToken) => roomToken.indexOf(queryToken))
          .filter((matchIndex) => matchIndex >= 0),
      );
      if (matchIndexes.length === 0) {
        return null;
      }

      return {
        room,
        exactMatch: roomTokens.some((roomToken) => roomQueryTokens.includes(roomToken)),
        startsWithMatch: roomTokens.some((roomToken) =>
          roomQueryTokens.some((queryToken) => roomToken.startsWith(queryToken)),
        ),
        firstMatchIndex: Math.min(...matchIndexes),
      };
    })
    .filter((suggestion): suggestion is NonNullable<typeof suggestion> => suggestion !== null)
    .sort(
      (a, b) =>
        Number(b.exactMatch) - Number(a.exactMatch) ||
        Number(b.startsWithMatch) - Number(a.startsWithMatch) ||
        a.firstMatchIndex - b.firstMatchIndex ||
        a.room.localeCompare(b.room, undefined, { numeric: true, sensitivity: "base" }),
    )
    .map((suggestion) => suggestion.room);
}

function getRoomSearchTokens(roomQuery: string, buildingCode: string) {
  const normalizedRoom = normalizeSearchToken(roomQuery);
  if (!normalizedRoom) {
    return [];
  }

  const normalizedBuildingCode = normalizeSearchToken(buildingCode);
  const normalizedRoomWithCode = normalizedRoom.startsWith(normalizedBuildingCode)
    ? normalizedRoom
    : `${normalizedBuildingCode}${normalizedRoom}`;

  return [...new Set([normalizedRoom, normalizedRoomWithCode])];
}

function getRoomTokens(room: string, buildingCode: string) {
  const normalizedRoom = normalizeSearchToken(room);
  const normalizedBuildingCode = normalizeSearchToken(buildingCode);
  const withoutBuildingCode = normalizedRoom.startsWith(normalizedBuildingCode)
    ? normalizedRoom.slice(normalizedBuildingCode.length)
    : normalizedRoom;
  return [...new Set([normalizedRoom, withoutBuildingCode].filter(Boolean))];
}

function normalizeSearchToken(value: string) {
  return value.toUpperCase().replaceAll(/[^A-Z0-9]/g, "");
}

function formatSuggestionTestId(value: string) {
  return value.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "-");
}

function getActiveRoomQuery(
  activeField: RoomFieldType | null,
  startRoom: string,
  endRoom: string,
) {
  if (activeField === "start") {
    return startRoom;
  }

  if (activeField === "end") {
    return endRoom;
  }

  return "";
}

function getSelectedRoomForField(
  activeField: RoomFieldType | null,
  selectedRooms: Record<RoomFieldType, string>,
) {
  if (!activeField) {
    return "";
  }

  return selectedRooms[activeField];
}

function getActiveSuggestions(
  activeField: RoomFieldType | null,
  startSuggestions: string[],
  endSuggestions: string[],
) {
  if (activeField === "start") {
    return startSuggestions;
  }

  if (activeField === "end") {
    return endSuggestions;
  }

  return [];
}

function getSuggestionField(
  activeField: RoomFieldType | null,
  activeQuery: string,
  selectedRoomForField: string,
  activeSuggestions: string[],
) {
  const shouldSuppressSelectedRoomSuggestions =
    !!activeField &&
    !!activeQuery &&
    normalizeSearchToken(activeQuery) === normalizeSearchToken(selectedRoomForField);

  if (!activeField || activeSuggestions.length === 0 || shouldSuppressSelectedRoomSuggestions) {
    return null;
  }

  return activeField;
}
