import BuildingFloor from "@/components/map/building-floor";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import {
  BuildingFloorInfo,
  FloorCheckpointsGraph,
  IndoorNavigationPath,
} from "@/types/mapTypes";
import { findIndoorPath } from "@/utils/indoorNavigation";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function IndoorMap() {
  const { buildingCode: buildingCodeParam } = useLocalSearchParams();
  const buildingCode =
    typeof buildingCodeParam === "string" ? buildingCodeParam : buildingCodeParam[0];

  const {
    data: floorInfo,
    error,
    isFetching,
  } = useQuery({
    queryKey: [buildingCode, "floorInfo"],
    queryFn: async (): Promise<BuildingFloorInfo> => {
      const info = await NavigationLoader.loadBuildingData(buildingCode);
      if (!info) {
        throw new Error("Couldn't load the floor info");
      }
      return info;
    },
    retry: false,
    throwOnError: true,
    gcTime: 0, // We set the gc time to 0 since we handle our own caching and garbage collection
  });
  const [floor] = useState<number | undefined>(undefined);
  const [navigationPath, setNavigationPath] = useState<IndoorNavigationPath | undefined>(
    undefined,
  );

  const firstFloor = useMemo(() => {
    if (floorInfo) {
      return getFirstFloor(floorInfo);
    }
  }, [floorInfo]);

  const defaultFloor = floor || firstFloor;

  return (
    <View style={styles.container}>
      {isFetching ? <Text>Loading...</Text> : null}
      {error ? <Text>Shiiit somethign went wrong</Text> : null}
      {floorInfo && defaultFloor ? (
        <>
          <BuildingFloor
            info={floorInfo}
            navigationPath={navigationPath}
            floor={defaultFloor}
          />
          <Button
            title="Create Random Path"
            onPress={() => {
              const graph = floorInfo.graphData;
              const source = getRandomCheckpointOnFloor(graph, defaultFloor).id;
              const destination = getRandomCheckpointOnFloor(graph, defaultFloor).id;
              const path = findIndoorPath(floorInfo.graphData, source, destination);
              setNavigationPath(path || undefined);
            }}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function getFirstFloor(info: BuildingFloorInfo) {
  const firstFloor = Object.keys(info.images).sort((a, b) => Number(a) - Number(b))[0];
  return Number(firstFloor);
}

function getRandomCheckpointOnFloor(graph: FloorCheckpointsGraph, floor: number) {
  const possibleCheckpoints = Object.values(graph.checkpoints).filter(
    (checkpoint) => checkpoint.floor === floor,
  );
  const r = randomInt(possibleCheckpoints.length);
  return possibleCheckpoints[r];
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}
