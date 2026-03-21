import { BuildingFloorInfo } from "@/types/mapTypes";
import { Image, StyleSheet, View } from "react-native";
import data from "@/data/buildings/floors/hall/jsonData/HallFloorPlanV4.json";
import { useMemo, useState } from "react";
import { BuildingNavigation } from "@/globals/BuildingRoomsStore";
import FloorSelector from "./floor-selection-menu";

interface BuildingFloorProps {
  info: BuildingFloorInfo;
}

export default function BuildingFloor({
  info: { imageURI },
}: Readonly<BuildingFloorProps>) {
  const [currentFloor, setCurrentFloor] = useState(1);
  const graph = useMemo(() => {
    return BuildingNavigation.createGraphFromObject(data);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={imageURI} style={styles.image} resizeMode="contain" />

      <FloorSelector
        buildingName="Hall" //TODO temp
        availableFloors={[1, 2, 3, 4, 5, 6, 7, 8, 9]} //TODO temp
        currentFloor={currentFloor}
        onSelectFloor={(floor: number) => setCurrentFloor(floor)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
