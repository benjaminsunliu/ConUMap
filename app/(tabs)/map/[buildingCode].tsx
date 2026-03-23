import BuildingFloor from "@/components/map/building-floor";
import { useLocalSearchParams } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import hallImage from "@/data/buildings/floors/H/Images/Hall9 (Custom).png";

export default function IndoorMap() {
  const { buildingCode } = useLocalSearchParams();
  return (
    <View style={styles.container}>
      <BuildingFloor
        info={{
          graphData: { adjacencySet: {}, checkpoints: {} },
          imageURI: hallImage,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
