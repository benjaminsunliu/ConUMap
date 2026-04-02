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
import {
  buildRoomLookup,
  getRoomSearchTokens,
  normalizeSearchToken,
  resolveCanonicalRoom,
} from "@/utils/roomSearch";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function IndoorMap() {
  const {
    buildingCode,
    indoorStartCheckpointId,
    indoorEndRoom,
    indoorStartRoom,
    indoorEndCheckpointId,
  } = useLocalSearchParams<{
    buildingCode: string;
    indoorStartCheckpointId?: string;
    indoorEndRoom?: string;
    indoorStartRoom?: string;
    indoorEndCheckpointId?: string;
  }>();
  const autoStartCheckpointId = normalizeParam(indoorStartCheckpointId);
  const autoEndRoom = normalizeParam(indoorEndRoom);
  const autoStartRoom = normalizeParam(indoorStartRoom);
  const autoEndCheckpointId = normalizeParam(indoorEndCheckpointId);

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
  const [hasCheckpointDrivenRoute, setHasCheckpointDrivenRoute] = useState(false);
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
  const roomAndEntrySuggestions = useMemo(
    () => buildIndoorLocationSuggestions(floorInfo),
    [floorInfo],
  );

  const defaultFloor = floor || firstFloor;
  const currentFloorIndex = defaultFloor ? availableFloors.indexOf(defaultFloor) : -1;
  const canGoNext =
    currentFloorIndex >= 0 && currentFloorIndex < availableFloors.length - 1;
  const canGoPrevious = currentFloorIndex > 0;
  const roomLookup = useMemo(
    () => buildRoomLookup(roomAndEntrySuggestions, buildingCode),
    [buildingCode, roomAndEntrySuggestions],
  );
  const validStartRoom = useMemo(
    () => resolveCanonicalRoom(startRoom, buildingCode, roomLookup),
    [buildingCode, roomLookup, startRoom],
  );
  const validEndRoom = useMemo(
    () => resolveCanonicalRoom(endRoom, buildingCode, roomLookup),
    [buildingCode, roomLookup, endRoom],
  );
  const canCreatePath = Boolean(validStartRoom && validEndRoom);
  const inputValidationError = useMemo(() => {
    const trimmedStartRoom = startRoom.trim();
    const trimmedEndRoom = endRoom.trim();

    if (!trimmedStartRoom || !trimmedEndRoom) {
      return undefined;
    }
    if (!validStartRoom && !validEndRoom) {
      return `Start location "${trimmedStartRoom}" and end location "${trimmedEndRoom}" were not found.`;
    }
    if (!validStartRoom) {
      return `Start location "${trimmedStartRoom}" was not found.`;
    }
    if (!validEndRoom) {
      return `End location "${trimmedEndRoom}" was not found.`;
    }

    return undefined;
  }, [endRoom, startRoom, validEndRoom, validStartRoom]);

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

  const createPathFromRooms = useCallback(() => {
    setHasCheckpointDrivenRoute(false);
    if (!floorInfo) {
      return;
    }

    const trimmedStartRoom = startRoom.trim();
    const trimmedEndRoom = endRoom.trim();
    if (!trimmedStartRoom || !trimmedEndRoom) {
      setRouteError("Enter both a start location and an end location.");
      setNavigationPath(undefined);
      return;
    }
    const canonicalStartRoom = resolveCanonicalRoom(
      trimmedStartRoom,
      buildingCode,
      roomLookup,
    );
    if (!canonicalStartRoom) {
      setRouteError(`Start location "${trimmedStartRoom}" was not found.`);
      setNavigationPath(undefined);
      return;
    }
    const canonicalEndRoom = resolveCanonicalRoom(
      trimmedEndRoom,
      buildingCode,
      roomLookup,
    );
    if (!canonicalEndRoom) {
      setRouteError(`End location "${trimmedEndRoom}" was not found.`);
      setNavigationPath(undefined);
      return;
    }

    if (canonicalStartRoom !== startRoom) {
      setStartRoom(canonicalStartRoom);
    }
    if (canonicalEndRoom !== endRoom) {
      setEndRoom(canonicalEndRoom);
    }

    const graph = floorInfo.graphData;
    const sourceCheckpoint = findCheckpointForRoom(
      graph,
      canonicalStartRoom,
      buildingCode,
    );
    if (!sourceCheckpoint) {
      setRouteError(`Start location "${canonicalStartRoom}" was not found.`);
      setNavigationPath(undefined);
      return;
    }
    const destinationCheckpoint = findCheckpointForRoom(
      graph,
      canonicalEndRoom,
      buildingCode,
    );
    if (!destinationCheckpoint) {
      setRouteError(`End location "${canonicalEndRoom}" was not found.`);
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
  }, [buildingCode, endRoom, floorInfo, roomLookup, startRoom]);

  const handleChangeStartRoom = useCallback((room: string) => {
    setHasCheckpointDrivenRoute(false);
    setStartRoom(room);
  }, []);

  const handleChangeEndRoom = useCallback((room: string) => {
    setHasCheckpointDrivenRoute(false);
    setEndRoom(room);
  }, []);

  useEffect(() => {
    if (!floorInfo) {
      return;
    }

    const graph = floorInfo.graphData;
    const hasCheckpointToRoomParams = Boolean(autoStartCheckpointId && autoEndRoom);
    const hasRoomToCheckpointParams = Boolean(autoStartRoom && autoEndCheckpointId);
    const hasRoomToRoomParams = Boolean(autoStartRoom && autoEndRoom);

    if (
      !hasCheckpointToRoomParams &&
      !hasRoomToCheckpointParams &&
      !hasRoomToRoomParams
    ) {
      return;
    }

    let sourceCheckpoint: FloorCheckpoint | undefined;
    let destinationCheckpoint: FloorCheckpoint | undefined;
    let resolvedStartLabel = "";
    let resolvedEndLabel = "";

    if (hasCheckpointToRoomParams) {
      sourceCheckpoint = graph.checkpoints[autoStartCheckpointId!];
      if (!sourceCheckpoint) {
        setRouteError("Could not find the indoor entrance checkpoint for this route.");
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      const canonicalEndRoom = resolveCanonicalRoom(autoEndRoom!, buildingCode, roomLookup);
      if (!canonicalEndRoom) {
        setRouteError(`End location "${autoEndRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      destinationCheckpoint = findCheckpointForRoom(graph, canonicalEndRoom, buildingCode);
      if (!destinationCheckpoint) {
        setRouteError(`End location "${canonicalEndRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      resolvedStartLabel = sourceCheckpoint.label?.trim() || sourceCheckpoint.id;
      resolvedEndLabel = canonicalEndRoom;
    } else if (hasRoomToCheckpointParams) {
      const canonicalStartRoom = resolveCanonicalRoom(
        autoStartRoom!,
        buildingCode,
        roomLookup,
      );
      if (!canonicalStartRoom) {
        setRouteError(`Start location "${autoStartRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      sourceCheckpoint = findCheckpointForRoom(graph, canonicalStartRoom, buildingCode);
      if (!sourceCheckpoint) {
        setRouteError(`Start location "${canonicalStartRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      destinationCheckpoint = graph.checkpoints[autoEndCheckpointId!];
      if (!destinationCheckpoint) {
        setRouteError("Could not find the indoor exit checkpoint for this route.");
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      resolvedStartLabel = canonicalStartRoom;
      resolvedEndLabel = destinationCheckpoint.label?.trim() || destinationCheckpoint.id;
    } else {
      const canonicalStartRoom = resolveCanonicalRoom(
        autoStartRoom!,
        buildingCode,
        roomLookup,
      );
      if (!canonicalStartRoom) {
        setRouteError(`Start location "${autoStartRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      sourceCheckpoint = findCheckpointForRoom(graph, canonicalStartRoom, buildingCode);
      if (!sourceCheckpoint) {
        setRouteError(`Start location "${canonicalStartRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      const canonicalEndRoom = resolveCanonicalRoom(autoEndRoom!, buildingCode, roomLookup);
      if (!canonicalEndRoom) {
        setRouteError(`End location "${autoEndRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      destinationCheckpoint = findCheckpointForRoom(graph, canonicalEndRoom, buildingCode);
      if (!destinationCheckpoint) {
        setRouteError(`End location "${canonicalEndRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      resolvedStartLabel = canonicalStartRoom;
      resolvedEndLabel = canonicalEndRoom;
    }

    const path = findIndoorPath(graph, sourceCheckpoint.id, destinationCheckpoint.id);
    if (!path) {
      setRouteError("No indoor path was found for this transition.");
      setNavigationPath(undefined);
      setHasCheckpointDrivenRoute(false);
      return;
    }

    setStartRoom(resolvedStartLabel);
    setEndRoom(resolvedEndLabel);
    setRouteError(undefined);
    setNavigationPath(path);
    setFloor(sourceCheckpoint.floor);
    setHasCheckpointDrivenRoute(true);
  }, [
    autoEndRoom,
    autoEndCheckpointId,
    autoStartCheckpointId,
    autoStartRoom,
    buildingCode,
    floorInfo,
    roomLookup,
  ]);

  useEffect(() => {
    const hasStepDrivenParams = Boolean(
      (autoStartCheckpointId && autoEndRoom) ||
        (autoStartRoom && autoEndCheckpointId) ||
        (autoStartRoom && autoEndRoom),
    );
    if (canCreatePath || hasCheckpointDrivenRoute || hasStepDrivenParams) {
      return;
    }
    setNavigationPath(undefined);
    setRouteError(undefined);
  }, [
    autoEndRoom,
    autoEndCheckpointId,
    autoStartCheckpointId,
    autoStartRoom,
    canCreatePath,
    hasCheckpointDrivenRoute,
  ]);

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
            onChangeStartRoom={handleChangeStartRoom}
            onChangeEndRoom={handleChangeEndRoom}
            roomSuggestions={roomAndEntrySuggestions}
            canCreatePath={canCreatePath}
            onCreatePath={createPathFromRooms}
            routeError={inputValidationError ?? routeError}
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

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

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
  return checkpoints.find((checkpoint) => {
    const checkpointTokens = getCheckpointTokens(checkpoint);
    return roomTokens.some((token) => checkpointTokens.includes(token));
  });
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

function buildIndoorLocationSuggestions(floorInfo: BuildingFloorInfo | undefined) {
  if (!floorInfo) {
    return [];
  }

  const roomSuggestions = (floorInfo.rooms ?? []).map((room) => room.trim()).filter(Boolean);
  const entryExitSuggestions = Object.values(floorInfo.graphData.checkpoints)
    .filter((checkpoint) => checkpoint.type === "building_entry_exit")
    .flatMap((checkpoint) => {
      const label = checkpoint.label?.trim();
      if (label && label !== checkpoint.id) {
        return [label, checkpoint.id];
      }
      return [checkpoint.id];
    });

  return [...new Set([...roomSuggestions, ...entryExitSuggestions])];
}
