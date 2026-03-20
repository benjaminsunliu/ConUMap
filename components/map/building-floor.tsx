import { BuildingFloorInfo } from "@/types/mapTypes";
import { Image, StyleSheet, View } from "react-native";
import data from "@/data/buildings/floors/hall/jsonData/HallFloorPlanV4.json";
import { useMemo } from "react";
import { BuildingNavigation } from "@/globals/BuildingRoomsStore";

interface BuildingFloorProps {
  info: BuildingFloorInfo;
}

export default function BuildingFloor({
  info: { imageURI },
}: Readonly<BuildingFloorProps>) {
  const graph = useMemo(() => {
    return BuildingNavigation.createGraphFromObject(data);
  }, []);
  return (
    <View style={styles.container}>
      <Image source={imageURI} style={styles.image} resizeMode="contain" />
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
