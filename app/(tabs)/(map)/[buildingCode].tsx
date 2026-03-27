import BuildingFloor from "@/components/map/building-floor";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import {
  BuildingFloorInfo,
  FloorCheckpointsGraph,
  IndoorNavigationPath,
} from "@/types/mapTypes";
import { findIndoorPath, findNearestEntryExitPath } from "@/utils/indoorNavigation";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function IndoorMap() {
  const { buildingCode } = useLocalSearchParams<{
    buildingCode: string;
  }>();

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
    gcTime: 0, // We set the gc time to 0 since we handle our own caching and garbage collection
  });
  const [floor, setFloor] = useState<number | undefined>(undefined);
  const [navigationPath, setNavigationPath] = useState<IndoorNavigationPath | undefined>(
    undefined,
  );

  const firstFloor = useMemo(() => {
    if (floorInfo) {
      return getFirstFloor(floorInfo);
    }
  }, [floorInfo]);

  const availableFloors = useMemo(() => {
    if (!floorInfo) {
      return [] as number[];
    }

    return Object.keys(floorInfo.images)
      .map((f) => Number(f))
      .sort((a, b) => a - b);
  }, [floorInfo]);

  const defaultFloor = floor ?? firstFloor;

  return (
    <View style={styles.container}>
      {isFetching ? <Text>Loading...</Text> : null}
      {error ? <Text>Something went wrong</Text> : null}
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
              const source = getRandomCheckpoint(graph).id;
              const destination = getRandomCheckpoint(graph).id;
              const path = findIndoorPath(floorInfo.graphData, source, destination);
              setNavigationPath(path || undefined);
            }}
          />
          <Button
            title={`Next Floor (${defaultFloor})`}
            onPress={() => {
              if (!availableFloors.length) {
                return;
              }

              setFloor((currentFloor) => {
                const activeFloor = currentFloor ?? firstFloor;
                if (activeFloor === undefined) {
                  return availableFloors[0];
                }

                const activeIndex = availableFloors.indexOf(activeFloor);
                if (activeIndex === -1) {
                  return availableFloors[0];
                }

                const nextIndex = (activeIndex + 1) % availableFloors.length;
                return availableFloors[nextIndex];
              });
            }}
          />
          <Button
            title="Random Checkpoint To Nearest Entry/Exit"
            onPress={() => {
              const graph = floorInfo.graphData;
              const source = getRandomCheckpoint(graph).id;
              const path = findNearestEntryExitPath(graph, source);
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

function getRandomCheckpoint(graph: FloorCheckpointsGraph) {
  const possibleCheckpoints = Object.values(graph.checkpoints);
  const r = randomInt(possibleCheckpoints.length);
  return possibleCheckpoints[r];
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}
