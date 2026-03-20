import BuildingFloor from "@/components/map/building-floor";
import hallImage from "@/data/buildings/floors/hall/Images/Hall9 (Custom).png";
import data from "@/data/buildings/floors/hall/jsonData/HallFloorPlanV4.json";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

export default function IndoorMap() {
  const { buildingCode } = useLocalSearchParams();
  const graph = useMemo(() => {
    return NavigationLoader.createGraphFromObject(data);
  }, []);
  return (
    <View style={styles.container}>
      <BuildingFloor
        info={{
          graphData: graph,
          imageURI: hallImage,
        }}
        floorNumber={9}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
