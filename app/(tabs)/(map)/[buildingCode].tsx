import BuildingFloor from "@/components/map/building-floor";
import MapSettings from "@/components/map/indoor-map-settings";
import IndoorNavigationControls from "@/components/map/indoor-navigation-controls";
import IndoorRoomFields from "@/components/map/indoor-room-fields";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { IndoorMapSettings } from "@/globals/IndoorMapSettingsStore";
import { OutdoorStepResume } from "@/globals/OutdoorStepResumeStore";
import {
  BuildingFloorInfo,
  FloorCheckpoint,
  FloorCheckpointsGraph,
  IndoorNavigationPath,
} from "@/types/mapTypes";
import {
  createFloorNavigationCommandSet,
  createStepNavigationCommandSet,
} from "@/utils/indoorNavigationCommands";
import { findIndoorPath } from "@/utils/indoorNavigation";
import { describeIndoorStep } from "@/utils/indoorStepInstructions";
import {
  buildRoomLookup,
  getRoomSearchTokens,
  normalizeSearchToken,
  resolveCanonicalRoom,
} from "@/utils/roomSearch";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function IndoorMap() {
  const {
    buildingCode,
    indoorStartCheckpointId,
    indoorEndRoom,
    indoorStartRoom,
    indoorEndCheckpointId,
    resumeContinuationId,
  } = useLocalSearchParams<{
    buildingCode: string;
    indoorStartCheckpointId?: string;
    indoorEndRoom?: string;
    indoorStartRoom?: string;
    indoorEndCheckpointId?: string;
    resumeContinuationId?: string;
  }>();
  const autoStartCheckpointId = normalizeParam(indoorStartCheckpointId);
  const autoEndRoom = normalizeParam(indoorEndRoom);
  const autoStartRoom = normalizeParam(indoorStartRoom);
  const autoEndCheckpointId = normalizeParam(indoorEndCheckpointId);
  const autoResumeContinuationId = normalizeParam(resumeContinuationId);

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
  const [currentPathStepIndex, setCurrentPathStepIndex] = useState(0);
  const [startRoom, setStartRoom] = useState("");
  const [endRoom, setEndRoom] = useState("");
  const [routeError, setRouteError] = useState<string | undefined>(undefined);
  const [hasCheckpointDrivenRoute, setHasCheckpointDrivenRoute] = useState(false);
  const [hasManualRouteAttempted, setHasManualRouteAttempted] = useState(false);
  const [wheelchairOnly, setWheelchairOnly] = useState(
    () => IndoorMapSettings.getCachedSettings().wheelchairOnly,
  );
  const [poiFilters, setPoiFilters] = useState({
    bathrooms: false,
    elevators: false,
    waterFountains: false,
    stairs: false,
    escalators: false,
  });
  const previousWheelchairOnly = useRef(wheelchairOnly);

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
  const canGoNextFloor =
    currentFloorIndex >= 0 && currentFloorIndex < availableFloors.length - 1;
  const canGoPreviousFloor = currentFloorIndex > 0;
  const outdoorStepResume = useMemo(
    () =>
      autoResumeContinuationId
        ? OutdoorStepResume.getContinuation(autoResumeContinuationId)
        : null,
    [autoResumeContinuationId],
  );
  const stepStopIndices = useMemo(() => {
    if (!floorInfo || !navigationPath || navigationPath.length === 0) {
      return [];
    }
    return buildIndoorStepStops(floorInfo.graphData, navigationPath);
  }, [floorInfo, navigationPath]);
  const hasStepNavigation = stepStopIndices.length > 0;
  const totalPathSteps = stepStopIndices.length;
  const boundedStepPointer = hasStepNavigation
    ? Math.min(currentPathStepIndex, totalPathSteps - 1)
    : 0;
  const activePathCheckpointIndex = hasStepNavigation
    ? stepStopIndices[boundedStepPointer]
    : 0;
  const nextPathCheckpointIndex =
    hasStepNavigation && boundedStepPointer < totalPathSteps - 1
      ? stepStopIndices[boundedStepPointer + 1]
      : undefined;
  const isOnLastIndoorStep =
    hasStepNavigation && boundedStepPointer >= totalPathSteps - 1;
  const canGoNextStep =
    hasStepNavigation &&
    (boundedStepPointer < totalPathSteps - 1 || Boolean(outdoorStepResume));
  const canGoPreviousStep = hasStepNavigation && boundedStepPointer > 0;
  const currentStepInstruction = useMemo(() => {
    if (
      !floorInfo ||
      !navigationPath ||
      navigationPath.length === 0 ||
      !hasStepNavigation
    ) {
      return undefined;
    }

    const instruction = describeIndoorStep({
      graph: floorInfo.graphData,
      path: navigationPath,
      stepIndex: activePathCheckpointIndex,
      nextStepIndex: nextPathCheckpointIndex,
      startLabel: startRoom,
      endLabel: endRoom,
    });

    if (instruction && isOnLastIndoorStep && outdoorStepResume) {
      return `${instruction} Continue to the outdoor route on the next step.`;
    }

    return instruction;
  }, [
    floorInfo,
    navigationPath,
    hasStepNavigation,
    activePathCheckpointIndex,
    nextPathCheckpointIndex,
    startRoom,
    endRoom,
    isOnLastIndoorStep,
    outdoorStepResume,
  ]);
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
  const noPathErrorMessage = useMemo(() => {
    return wheelchairOnly
      ? "No wheelchair-accessible indoor path was found between those rooms."
      : "No indoor path was found between those rooms.";
  }, [wheelchairOnly]);
  const transitionPathErrorMessage = useMemo(() => {
    return wheelchairOnly
      ? "No wheelchair-accessible indoor path was found for this transition."
      : "No indoor path was found for this transition.";
  }, [wheelchairOnly]);
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

  type NavigationDirection = "next" | "prev";
  const handleFloorNavigation = useCallback(
    (direction: NavigationDirection) => {
      if (currentFloorIndex < 0) {
        return;
      }
      const delta = direction === "next" ? 1 : -1;
      const newFloorIndex = Math.min(
        Math.max(currentFloorIndex + delta, 0),
        availableFloors.length - 1,
      );
      setFloor(availableFloors[newFloorIndex]);
    },
    [availableFloors, currentFloorIndex],
  );
  const handleStepNavigation = useCallback(
    (direction: NavigationDirection) => {
      if (!hasStepNavigation || !navigationPath || !floorInfo) {
        return;
      }

      if (direction === "next" && isOnLastIndoorStep) {
        if (outdoorStepResume) {
          OutdoorStepResume.setPendingStep(outdoorStepResume);
          if (autoResumeContinuationId) {
            OutdoorStepResume.clearContinuation(autoResumeContinuationId);
          }
          router.back();
        }
        return;
      }

      const delta = direction === "next" ? 1 : -1;
      const nextStepPointer = Math.min(
        Math.max(boundedStepPointer + delta, 0),
        totalPathSteps - 1,
      );
      if (nextStepPointer === boundedStepPointer) {
        return;
      }

      const nextPathIndex = stepStopIndices[nextStepPointer];
      const nextStepCheckpoint =
        floorInfo.graphData.checkpoints[navigationPath[nextPathIndex]];
      if (!nextStepCheckpoint) {
        return;
      }

      setCurrentPathStepIndex(nextStepPointer);
      setFloor(nextStepCheckpoint.floor);
    },
    [
      autoResumeContinuationId,
      boundedStepPointer,
      floorInfo,
      hasStepNavigation,
      isOnLastIndoorStep,
      navigationPath,
      outdoorStepResume,
      stepStopIndices,
      totalPathSteps,
    ],
  );
  const navigationControls = useMemo(() => {
    const currentFloor = defaultFloor ?? firstFloor ?? 0;

    if (hasStepNavigation) {
      return createStepNavigationCommandSet({
        currentFloor,
        currentStep: boundedStepPointer + 1,
        totalSteps: Math.max(totalPathSteps, 1),
        stepInstruction: currentStepInstruction,
        canGoNext: canGoNextStep,
        canGoPrevious: canGoPreviousStep,
        onNext: () => handleStepNavigation("next"),
        onPrevious: () => handleStepNavigation("prev"),
      });
    }

    return createFloorNavigationCommandSet({
      currentFloor,
      canGoNext: canGoNextFloor,
      canGoPrevious: canGoPreviousFloor,
      onNext: () => handleFloorNavigation("next"),
      onPrevious: () => handleFloorNavigation("prev"),
    });
  }, [
    boundedStepPointer,
    canGoNextFloor,
    canGoNextStep,
    canGoPreviousFloor,
    canGoPreviousStep,
    currentStepInstruction,
    defaultFloor,
    firstFloor,
    handleFloorNavigation,
    handleStepNavigation,
    hasStepNavigation,
    totalPathSteps,
  ]);

  const createPathFromRooms = useCallback(() => {
    setHasCheckpointDrivenRoute(false);
    setHasManualRouteAttempted(true);
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

    const path = findIndoorPath(graph, sourceCheckpoint.id, destinationCheckpoint.id, {
      accessibleOnly: wheelchairOnly,
    });
    if (!path) {
      setRouteError(noPathErrorMessage);
      setNavigationPath(undefined);
      return;
    }

    setRouteError(undefined);
    setNavigationPath(path);
    setFloor(sourceCheckpoint.floor);
  }, [
    buildingCode,
    endRoom,
    floorInfo,
    noPathErrorMessage,
    roomLookup,
    startRoom,
    wheelchairOnly,
  ]);

  const handleChangeStartRoom = useCallback((room: string) => {
    setHasCheckpointDrivenRoute(false);
    setHasManualRouteAttempted(false);
    setStartRoom(room);
  }, []);

  const handleChangeEndRoom = useCallback((room: string) => {
    setHasCheckpointDrivenRoute(false);
    setHasManualRouteAttempted(false);
    setEndRoom(room);
  }, []);

  const handleSetWheelchairOnly = useCallback((value: boolean) => {
    setWheelchairOnly(value);
    void IndoorMapSettings.setWheelchairOnly(value).catch(() => {
      // Keep the in-memory setting if persistence is unavailable.
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    IndoorMapSettings.getSettings()
      .then((settings) => {
        if (!isMounted) {
          return;
        }
        setWheelchairOnly(settings.wheelchairOnly);
      })
      .catch(() => {
        // Keep the in-memory default if persisted settings cannot be loaded.
      });

    return () => {
      isMounted = false;
    };
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

      const canonicalEndRoom = resolveCanonicalRoom(
        autoEndRoom!,
        buildingCode,
        roomLookup,
      );
      if (!canonicalEndRoom) {
        setRouteError(`End location "${autoEndRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      destinationCheckpoint = findCheckpointForRoom(
        graph,
        canonicalEndRoom,
        buildingCode,
      );
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

      const canonicalEndRoom = resolveCanonicalRoom(
        autoEndRoom!,
        buildingCode,
        roomLookup,
      );
      if (!canonicalEndRoom) {
        setRouteError(`End location "${autoEndRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      destinationCheckpoint = findCheckpointForRoom(
        graph,
        canonicalEndRoom,
        buildingCode,
      );
      if (!destinationCheckpoint) {
        setRouteError(`End location "${canonicalEndRoom}" was not found.`);
        setNavigationPath(undefined);
        setHasCheckpointDrivenRoute(false);
        return;
      }

      resolvedStartLabel = canonicalStartRoom;
      resolvedEndLabel = canonicalEndRoom;
    }

    const path = findIndoorPath(graph, sourceCheckpoint.id, destinationCheckpoint.id, {
      accessibleOnly: wheelchairOnly,
    });
    if (!path) {
      setRouteError(transitionPathErrorMessage);
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
    transitionPathErrorMessage,
    wheelchairOnly,
  ]);

  useEffect(() => {
    if (previousWheelchairOnly.current === wheelchairOnly) {
      return;
    }

    previousWheelchairOnly.current = wheelchairOnly;

    if (
      hasCheckpointDrivenRoute ||
      !hasManualRouteAttempted ||
      !validStartRoom ||
      !validEndRoom
    ) {
      return;
    }

    createPathFromRooms();
  }, [
    createPathFromRooms,
    hasCheckpointDrivenRoute,
    hasManualRouteAttempted,
    validEndRoom,
    validStartRoom,
    wheelchairOnly,
  ]);

  useEffect(() => {
    return () => {
      if (autoResumeContinuationId) {
        OutdoorStepResume.clearContinuation(autoResumeContinuationId);
      }
    };
  }, [autoResumeContinuationId]);

  useEffect(() => {
    if (
      !navigationPath ||
      navigationPath.length === 0 ||
      !floorInfo ||
      stepStopIndices.length === 0
    ) {
      setCurrentPathStepIndex(0);
      return;
    }

    setCurrentPathStepIndex(0);
    const firstCheckpoint =
      floorInfo.graphData.checkpoints[navigationPath[stepStopIndices[0]]];
    if (firstCheckpoint) {
      setFloor(firstCheckpoint.floor);
    }
  }, [floorInfo, navigationPath, stepStopIndices]);

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
            wheelchairOnly={wheelchairOnly}
            setWheelchairOnly={handleSetWheelchairOnly}
            poiFilters={poiFilters}
            setPoiFilters={setPoiFilters}
          />
          <IndoorNavigationControls
            {...navigationControls}
          />
          <BuildingFloor
            info={floorInfo}
            poiFilters={poiFilters}
            navigationPath={navigationPath}
            floor={defaultFloor}
            isStepMode={hasStepNavigation}
            activeStepIndex={activePathCheckpointIndex}
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

  const roomSuggestions = (floorInfo.rooms ?? [])
    .map((room) => room.trim())
    .filter(Boolean);
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

const VERTICAL_EDGE_TYPES = new Set(["stair", "elevator", "escalator"]);
const VERTICAL_NODE_TYPES = new Set(["stair_landing", "elevator_door", "escalator"]);

function buildIndoorStepStops(graph: FloorCheckpointsGraph, path: IndoorNavigationPath) {
  if (!Array.isArray(path) || path.length === 0) {
    return [];
  }

  const checkpoints = graph.checkpoints;
  const stops = [0];
  let currentIndex = 0;

  while (currentIndex < path.length - 1) {
    let nextStopIndex = currentIndex + 1;
    const currentCheckpoint = checkpoints[path[currentIndex]];
    const immediateNextCheckpoint = checkpoints[path[currentIndex + 1]];
    const immediateEdge = currentCheckpoint
      ? graph.adjacencySet[currentCheckpoint.id]?.[path[currentIndex + 1]]
      : undefined;

    if (
      currentCheckpoint &&
      immediateNextCheckpoint &&
      isVerticalTraversalEdge(
        immediateEdge?.type,
        currentCheckpoint,
        immediateNextCheckpoint,
      )
    ) {
      while (nextStopIndex < path.length - 1) {
        const from = checkpoints[path[nextStopIndex]];
        const to = checkpoints[path[nextStopIndex + 1]];
        const edgeType = from
          ? graph.adjacencySet[from.id]?.[path[nextStopIndex + 1]]?.type
          : "";
        if (!from || !to || !isVerticalTraversalEdge(edgeType, from, to)) {
          break;
        }
        nextStopIndex += 1;
      }
    }

    if (stops[stops.length - 1] !== nextStopIndex) {
      stops.push(nextStopIndex);
    }
    currentIndex = nextStopIndex;
  }

  const destinationIndex = path.length - 1;
  if (stops[stops.length - 1] !== destinationIndex) {
    stops.push(destinationIndex);
  }

  return stops;
}

function isVerticalTraversalEdge(
  edgeType: string | undefined,
  currentCheckpoint: FloorCheckpoint,
  nextCheckpoint: FloorCheckpoint,
) {
  if (currentCheckpoint.floor === nextCheckpoint.floor) {
    return false;
  }

  if (edgeType && VERTICAL_EDGE_TYPES.has(edgeType)) {
    return true;
  }

  return (
    VERTICAL_NODE_TYPES.has(currentCheckpoint.type) ||
    VERTICAL_NODE_TYPES.has(nextCheckpoint.type)
  );
}
