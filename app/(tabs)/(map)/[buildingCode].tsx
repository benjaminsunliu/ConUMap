import BuildingFloor from "@/components/map/building-floor";
import MapSettings from "@/components/map/indoor-map-settings";
import IndoorNavigationControls from "@/components/map/indoor-navigation-controls";
import IndoorRoomFields from "@/components/map/indoor-room-fields";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import {
  BuildingFloorInfo,
  FloorCheckpoint,
  FloorCheckpointsGraph,
  IndoorNavigationPath,
} from "@/types/mapTypes";
import { findIndoorPath } from "@/utils/indoorNavigation";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
  const [startRoom, setStartRoom] = useState("");
  const [endRoom, setEndRoom] = useState("");
  const [routeError, setRouteError] = useState<string | undefined>(undefined);
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [poiFilters, setPoiFilters] = useState({
    bathrooms: false,
    elevators: false,
    washrooms: false,
  });

  const availableFloors: number[] = useMemo(() => {
    return floorInfo?.images
      ? Object.keys(floorInfo.images)
          .map(Number)
          .sort((a, b) => a - b)
      : [];
  }, [floorInfo]);

  const firstFloor = useMemo(() => {
    return availableFloors[0];
  }, [availableFloors]);

  const defaultFloor = floor || firstFloor;
  const currentFloorIndex = defaultFloor ? availableFloors.indexOf(defaultFloor) : -1;
  const canGoNext =
    currentFloorIndex >= 0 && currentFloorIndex < availableFloors.length - 1;
  const canGoPrevious = currentFloorIndex > 0;
  const canCreatePath = startRoom.trim().length > 0 && endRoom.trim().length > 0;

  type FloorDirection = "next" | "prev";
  const handleFloorNavigation = (direction: FloorDirection) => {
    if (currentFloorIndex < 0) {
      return;
    }
    const delta = direction === "next" ? 1 : -1;
    const newFloorIndex = Math.min(
      Math.max(currentFloorIndex + delta, 0),
      availableFloors.length - 1,
    );
    setFloor(availableFloors[newFloorIndex]);
  };

  const createPathFromRooms = () => {
    if (!floorInfo) {
      return;
    }

    const trimmedStartRoom = startRoom.trim();
    const trimmedEndRoom = endRoom.trim();
    if (!trimmedStartRoom || !trimmedEndRoom) {
      setRouteError("Enter both a start room and an end room.");
      setNavigationPath(undefined);
      return;
    }

    const graph = floorInfo.graphData;
    const sourceCheckpoint = findCheckpointForRoom(graph, trimmedStartRoom, buildingCode);
    if (!sourceCheckpoint) {
      setRouteError(`Start room "${trimmedStartRoom}" was not found.`);
      setNavigationPath(undefined);
      return;
    }
    const destinationCheckpoint = findCheckpointForRoom(
      graph,
      trimmedEndRoom,
      buildingCode,
    );
    if (!destinationCheckpoint) {
      setRouteError(`End room "${trimmedEndRoom}" was not found.`);
      setNavigationPath(undefined);
      return;
    }

    const path = findIndoorPath(graph, sourceCheckpoint.id, destinationCheckpoint.id);
    if (!path) {
      setRouteError("No indoor path was found between those rooms.");
      setNavigationPath(undefined);
      return;
    }

    setRouteError(undefined);
    setNavigationPath(path);
    setFloor(sourceCheckpoint.floor);
  };

  useEffect(() => {
    if (canCreatePath) {
      return;
    }
    setNavigationPath(undefined);
    setRouteError(undefined);
  }, [canCreatePath]);

  return (
    <View style={styles.container}>
      {isFetching ? <Text>Loading...</Text> : null}
      {error ? <Text>Something went wrong</Text> : null}
      {floorInfo && defaultFloor ? (
        <>
          <IndoorRoomFields
            buildingCode={buildingCode}
            startRoom={startRoom}
            endRoom={endRoom}
            onChangeStartRoom={setStartRoom}
            onChangeEndRoom={setEndRoom}
            roomSuggestions={floorInfo.rooms}
            canCreatePath={canCreatePath}
            onCreatePath={createPathFromRooms}
            routeError={routeError}
          />
          <MapSettings
            wheelchairOnly={wheelchairOnly} //TODO temp
            setWheelchairOnly={setWheelchairOnly} //TODO temp
            poiFilters={poiFilters} //TODO temp
            setPoiFilters={setPoiFilters} //TODO temp
          />
          <IndoorNavigationControls
            onNext={() => handleFloorNavigation("next")}
            onPrevious={() => handleFloorNavigation("prev")}
            currentFloor={defaultFloor}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
          />
          <BuildingFloor
            info={floorInfo}
            navigationPath={navigationPath}
            floor={defaultFloor}
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

function findCheckpointForRoom(
  graph: FloorCheckpointsGraph,
  roomQuery: string,
  buildingCode: string,
) {
  const roomTokens = getRoomSearchTokens(roomQuery, buildingCode);
  if (roomTokens.length === 0) {
    return undefined;
  }

  const checkpoints = Object.values(graph.checkpoints);
  const exactMatch = checkpoints.find((checkpoint) => {
    const checkpointTokens = getCheckpointTokens(checkpoint);
    return roomTokens.some((token) => checkpointTokens.includes(token));
  });
  if (exactMatch) {
    return exactMatch;
  }

  return checkpoints.find((checkpoint) => {
    const checkpointTokens = getCheckpointTokens(checkpoint);
    return roomTokens.some((token) =>
      checkpointTokens.some((checkpointToken) => checkpointToken.includes(token)),
    );
  });
}

function getRoomSearchTokens(roomQuery: string, buildingCode: string) {
  const normalizedRoom = normalizeSearchToken(roomQuery);
  if (!normalizedRoom) {
    return [];
  }

  const normalizedBuildingCode = normalizeSearchToken(buildingCode);
  const normalizedRoomWithCode = normalizedRoom.startsWith(normalizedBuildingCode)
    ? normalizedRoom
    : `${normalizedBuildingCode}${normalizedRoom}`;

  return [...new Set([normalizedRoom, normalizedRoomWithCode])];
}

function getCheckpointTokens(checkpoint: FloorCheckpoint) {
  const tokens = [normalizeSearchToken(checkpoint.id)];
  if (checkpoint.label) {
    const normalizedLabel = normalizeSearchToken(checkpoint.label);
    if (normalizedLabel) {
      tokens.push(normalizedLabel);
    }
  }
  return tokens;
}

function normalizeSearchToken(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
