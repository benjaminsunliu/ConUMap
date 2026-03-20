import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function IndoorMap() {
  const { buildingCode } = useLocalSearchParams();
  return (
    <View>
      <Text>I am indoors in the {buildingCode} building</Text>
    </View>
  );
}
