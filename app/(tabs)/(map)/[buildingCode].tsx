import BuildingFloor from "@/components/map/building-floor";
import { CAMPUS_BUILDINGS } from "@/constants/map";
import { CODE_TO_FLOOR_ASSET_INFO, NavigationLoader } from "@/globals/IndoorNavigationLoader";
import {
  BuildingCode,
  BuildingFloorInfo,
  FloorCheckpointsGraph,
  FloorCheckpointId,
  IndoorNavigationPath,
} from "@/types/mapTypes";
import { findIndoorPath, findNearestEntryExitPath } from "@/utils/indoorNavigation";
import {
  buildHybridRoute,
  getNextHybridPhase,
  HybridNavigationPhase,
  HybridRoute,
  IndoorOutdoorBridgeMap,
} from "@/utils/hybridNavigation";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function IndoorMap() {
  const { buildingCode, hybridPath, hybridPhaseParam, hybridStatusParam } =
    useLocalSearchParams<{
    buildingCode: string;
    hybridPath?: string;
    hybridPhaseParam?: HybridNavigationPhase;
    hybridStatusParam?: string;
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
  const [hybridRoute, setHybridRoute] = useState<HybridRoute | null>(null);
  const [hybridPhase, setHybridPhase] = useState<HybridNavigationPhase>("DONE");
  const [hybridStatus, setHybridStatus] = useState<string>("");

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

  useEffect(() => {
    if (!hybridPath) {
      return;
    }

    const parsedPath = hybridPath.split("|").filter(Boolean);
    setNavigationPath(parsedPath.length ? parsedPath : undefined);
    if (hybridPhaseParam) {
      setHybridPhase(hybridPhaseParam);
    }
    if (hybridStatusParam) {
      setHybridStatus(hybridStatusParam);
    }
  }, [hybridPath, hybridPhaseParam, hybridStatusParam]);

  return (
    <View style={styles.container}>
      {isFetching ? <Text>Loading...</Text> : null}
      {error ? <Text>Something went wrong</Text> : null}
      {floorInfo && defaultFloor !== undefined ? (
        <>
          <BuildingFloor
            info={floorInfo}
            navigationPath={navigationPath}
            floor={defaultFloor}
          />
          <Text style={styles.statusText}>Hybrid phase: {hybridPhase}</Text>
          {hybridStatus ? <Text style={styles.statusText}>{hybridStatus}</Text> : null}
          <Button
            title="Create Random Path"
            onPress={() => {
              const graph = floorInfo.graphData;
              const start = getRandomCheckpoint(graph).id;
              const destination = getRandomCheckpoint(graph).id;
              const path = findIndoorPath(floorInfo.graphData, start, destination);
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
              const start = getRandomCheckpoint(graph).id;
              const path = findNearestEntryExitPath(graph, start);
              setNavigationPath(path || undefined);
            }}
          />
          <Button
            title="Build Hybrid Route Demo"
            onPress={async () => {
              try {
                const startBuilding = floorInfo.buildingCode as BuildingCode;
                const destinationBuilding = getDemoDestinationBuilding(startBuilding);
                const destinationFloorInfo = await NavigationLoader.loadBuildingData(
                  destinationBuilding,
                );

                if (!destinationFloorInfo) {
                  setHybridStatus("Could not load destination building graph.");
                  return;
                }

                const startNode = getRandomIndoorRoomNodeId(floorInfo.graphData);
                const destinationNode = getRandomIndoorRoomNodeId(
                  destinationFloorInfo.graphData,
                );

                const bridgeMap = buildDemoBridgeMap([floorInfo, destinationFloorInfo]);

                const route = await buildHybridRoute({
                  startBuilding,
                  destinationBuilding,
                  startRoomNodeId: startNode,
                  destinationRoomNodeId: destinationNode,
                  startGraph: floorInfo.graphData,
                  destinationGraph: destinationFloorInfo.graphData,
                  bridgeMap,
                  preferredOutdoorMode: "walking",
                });

                const phaseResult = getIndoorPathForPhase(
                  route,
                  route.initialPhase,
                  startBuilding,
                );

                setHybridRoute(route);
                setHybridPhase(route.initialPhase);
                setHybridStatus(phaseResult.message);
                setNavigationPath(phaseResult.path);
              } catch (e) {
                setHybridRoute(null);
                setHybridPhase("ERROR");
                setNavigationPath(undefined);
                setHybridStatus(
                  e instanceof Error ? e.message : "Failed to build hybrid route",
                );
              }
            }}
          />
          <Button
            title="Continue Hybrid Phase"
            onPress={() => {
              if (!hybridRoute) {
                return;
              }

              const nextPhase = getNextHybridPhase(hybridPhase, hybridRoute);
              const phaseResult = getIndoorPathForPhase(
                hybridRoute,
                nextPhase,
                floorInfo.buildingCode as BuildingCode,
              );

              if (
                nextPhase === "INDOOR_DEST" &&
                hybridRoute.startBuilding !== hybridRoute.destinationBuilding
              ) {
                const indoorSegments = hybridRoute.segments.filter(
                  (segment) => segment.type === "indoor",
                );
                const destinationSegment = indoorSegments[indoorSegments.length - 1];

                if (destinationSegment) {
                  router.push({
                    pathname: "/[buildingCode]",
                    params: {
                      buildingCode: destinationSegment.buildingCode,
                      hybridPath: destinationSegment.path.join("|"),
                      hybridPhaseParam: "INDOOR_DEST",
                      hybridStatusParam: `Destination indoor phase in building ${destinationSegment.buildingCode}`,
                    },
                  });
                  return;
                }
              }

              setHybridPhase(nextPhase);
              setHybridStatus(phaseResult.message);
              setNavigationPath(phaseResult.path);
            }}
          />

          {hybridRoute && hybridPhase === "OUTDOOR" ? (
            <Button
              title="Continue to Outdoor Map"
              onPress={() => {
                const outdoorSegment = hybridRoute.segments.find(
                  (segment) => segment.type === "outdoor",
                );
                const indoorSegments = hybridRoute.segments.filter(
                  (segment) => segment.type === "indoor",
                );
                const destinationSegment = indoorSegments[indoorSegments.length - 1];

                if (!outdoorSegment || outdoorSegment.type !== "outdoor") {
                  setHybridStatus("No outdoor segment available.");
                  return;
                }

                if (!destinationSegment) {
                  setHybridStatus("No destination indoor segment available.");
                  return;
                }

                const startBuildingInfo = CAMPUS_BUILDINGS.find(
                  (building) => building.buildingCode === hybridRoute.startBuilding,
                );
                const destinationBuildingInfo = CAMPUS_BUILDINGS.find(
                  (building) => building.buildingCode === hybridRoute.destinationBuilding,
                );

                const outdoorStart = startBuildingInfo?.location ?? outdoorSegment.from;
                const outdoorEnd = destinationBuildingInfo?.location ?? outdoorSegment.to;

                router.push({
                  pathname: "/(tabs)/(map)",
                  params: {
                    outdoorStartLat: String(outdoorStart.latitude),
                    outdoorStartLng: String(outdoorStart.longitude),
                    outdoorEndLat: String(outdoorEnd.latitude),
                    outdoorEndLng: String(outdoorEnd.longitude),
                    outdoorStartLabel:
                      startBuildingInfo?.buildingName ?? hybridRoute.startBuilding,
                    outdoorEndLabel:
                      destinationBuildingInfo?.buildingName ??
                      hybridRoute.destinationBuilding,
                    hybridDestBuildingCode: destinationSegment.buildingCode,
                    hybridDestPath: destinationSegment.path.join("|"),
                    hybridDestPhase: "INDOOR_DEST",
                    hybridDestStatus: `Destination indoor phase in building ${destinationSegment.buildingCode}`,
                  },
                });
              }}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusText: {
    paddingHorizontal: 12,
    paddingVertical: 4,
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

function getRandomIndoorRoomNodeId(graph: FloorCheckpointsGraph): FloorCheckpointId {
  const candidates = Object.values(graph.checkpoints).filter(
    (checkpoint) => checkpoint.type !== "building_entry_exit",
  );

  if (candidates.length === 0) {
    return getRandomCheckpoint(graph).id;
  }

  const r = randomInt(candidates.length);
  return candidates[r].id;
}

function getDemoDestinationBuilding(startBuilding: BuildingCode): BuildingCode {
  const allBuildings = Object.keys(CODE_TO_FLOOR_ASSET_INFO) as BuildingCode[];
  const destination = allBuildings.find((code) => code !== startBuilding);
  return destination ?? startBuilding;
}

function buildDemoBridgeMap(floorInfos: BuildingFloorInfo[]): IndoorOutdoorBridgeMap {
  const map: IndoorOutdoorBridgeMap = {};

  floorInfos.forEach((info) => {
    const centroid = CAMPUS_BUILDINGS.find(
      (building) => building.buildingCode === info.buildingCode,
    )?.location;

    if (!centroid) {
      return;
    }

    const entryExits = Object.values(info.graphData.checkpoints).filter(
      (checkpoint) => checkpoint.type === "building_entry_exit",
    );

    map[info.buildingCode] = {};
    entryExits.forEach((entryExit) => {
      map[info.buildingCode]![entryExit.id] = centroid;
    });
  });

  return map;
}

// Returns path + feedback message of current navigation phase for user
function getIndoorPathForPhase(
  route: HybridRoute,
  phase: HybridNavigationPhase,
  currentBuilding: BuildingCode,
): { path: IndoorNavigationPath | undefined; message: string } {
  if (phase === "DONE") {
    return { path: undefined, message: "Navigation complete." };
  }

  if (phase === "OUTDOOR") {
    return {
      path: undefined,
      message: "Outdoor phase active. Continue to switch back to indoor guidance.",
    };
  }

  const indoorSegments = route.segments.filter((segment) => segment.type === "indoor");

  if (phase === "INDOOR_START") {
    const startSegment = indoorSegments[0];
    if (!startSegment) {
      return { path: undefined, message: "No start indoor segment found." };
    }
    return {
      path: startSegment.path,
      message: `start indoor phase in building ${startSegment.buildingCode}`,
    };
  }

  if (phase === "INDOOR_DEST") {
    const destinationSegment = indoorSegments[indoorSegments.length - 1];
    if (!destinationSegment) {
      return { path: undefined, message: "No destination indoor segment found." };
    }

    if (destinationSegment.buildingCode !== currentBuilding) {
      return {
        path: undefined,
        message: `Destination indoor segment is in building ${destinationSegment.buildingCode}.`,
      };
    }

    return {
      path: destinationSegment.path,
      message: `Destination indoor phase in building ${destinationSegment.buildingCode}`,
    };
  }

  return { path: undefined, message: "Hybrid route phase is not available." };
}
