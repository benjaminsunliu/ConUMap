import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface IndoorRoomFieldsProps {
  buildingCode: string;
  startRoom: string;
  endRoom: string;
  onChangeStartRoom: (value: string) => void;
  onChangeEndRoom: (value: string) => void;
  onCreatePath: () => void;
  routeError?: string;
}

export default function IndoorRoomFields({
  buildingCode,
  startRoom,
  endRoom,
  onChangeStartRoom,
  onChangeEndRoom,
  onCreatePath,
  routeError,
}: Readonly<IndoorRoomFieldsProps>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = makeStyles(theme);
  const endInputRef = useRef<TextInput>(null);

  return (
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
              value={startRoom}
              onChangeText={onChangeStartRoom}
              placeholder={`Start (${buildingCode}820)`}
              placeholderTextColor={theme.placeholder}
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => endInputRef.current?.focus()}
            />
          </View>

          <View style={styles.field}>
            <Ionicons
              name="flag-outline"
              size={16}
              color={theme.floorSelection.chevron}
            />
            <TextInput
              ref={endInputRef}
              value={endRoom}
              onChangeText={onChangeEndRoom}
              placeholder={`End (${buildingCode}838)`}
              placeholderTextColor={theme.placeholder}
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onCreatePath}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.routeButton} onPress={onCreatePath} activeOpacity={0.85}>
          <Text style={styles.routeButtonText}>Navigate</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.mapSettings.fabBackground} />
        </TouchableOpacity>

        {routeError ? <Text style={styles.errorText}>{routeError}</Text> : null}
      </View>
    </View>
  );
}

const makeStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: "2%",
      alignSelf: "center",
      zIndex: 11,
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
