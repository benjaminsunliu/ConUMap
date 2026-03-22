import BuildingFloor from "@/components/map/building-floor";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function IndoorMap() {
  const { buildingCode: buildingCodeParam } = useLocalSearchParams();
  const buildingCode = buildingCodeParam[0];
  const {
    data: floorInfo,
    error,
    isFetching,
  } = useQuery({
    queryKey: [buildingCode, "floorInfo"],
    queryFn: async () => {
      const floorInfo = await NavigationLoader.loadBuildingData(buildingCode);
      if (!floorInfo) {
        throw new Error("Couldn't load the floor info");
      }
      return floorInfo;
    },
    retry: false,
    throwOnError: true,
    gcTime: 0, // We set the gc time to 0 since we handle our own caching and garbage collection
  });

  return (
    <View style={styles.container}>
      {isFetching ? <Text>Loading...</Text> : null}
      {error ? <Text>Shiiit somethign went wrong</Text> : null}
      {floorInfo ? <BuildingFloor info={floorInfo} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
