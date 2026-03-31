import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

export type ActionIconName = keyof typeof Ionicons.glyphMap;

interface ActionButtonProps {
  readonly label: string;
  readonly icon?: ActionIconName;
  readonly onPress?: () => void;
  readonly testID: string;
  readonly theme: typeof Colors.light;
  readonly active?: boolean;
}

export function ActionButton({
  label,
  icon,
  onPress,
  testID,
  theme,
  active = true,
}: Readonly<ActionButtonProps>) {
  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          borderRadius: 20,
          height: 40,
          backgroundColor: theme.buildingInfoPopup.actionButtonBackground,
        },
      ]}
      onPress={active ? onPress : undefined}
      testID={testID}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          active
            ? theme.buildingInfoPopup.actionButtonIcon
            : theme.buildingInfoPopup.disabledActionButtonColor
        }
        style={{ marginRight: 6 }}
      />
      <Text
        style={{
          color: active
            ? theme.buildingInfoPopup.actionButtonText
            : theme.buildingInfoPopup.disabledActionButtonColor,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
