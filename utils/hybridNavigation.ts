import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { SearchBuilding, TransportationMode } from "@/types/buildingTypes";
import { BuildingInfo, FloorCheckpoint, FloorCheckpointsGraph } from "@/types/mapTypes";
import type {
  NormalizedIndoorDetails,
  NormalizedRoute,
  NormalizedStep,
} from "@/utils/directions";
import { findIndoorPath } from "@/utils/indoorNavigation";
import { getRoomSearchTokens, normalizeSearchToken } from "@/utils/roomSearch";

type IndoorSelections = {
  start: SearchBuilding | null;
  end: SearchBuilding | null;
};

type IndoorTransitionOptions = {
  accessibleOnly?: boolean;
};

type IndoorRoomSelection = {
  buildingCode: string;
  roomName: string;
};

export type RoutesByTransportationMode = Record<
  TransportationMode,
  NormalizedRoute[] | null
>;

const INDOOR_TRAVEL_MODE = "INDOOR";
const INDOOR_STEP_PAYLOAD_PREFIX = "__INDOOR_STEP__:";

export type IndoorStepPayload = NormalizedIndoorDetails;

export function encodeIndoorStepPayload(payload: IndoorStepPayload) {
  return `${INDOOR_STEP_PAYLOAD_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`;
}

export function decodeIndoorStepPayload(encoded: string) {
  if (!encoded?.startsWith(INDOOR_STEP_PAYLOAD_PREFIX)) {
    return null;
  }

  const encodedJson = encoded.slice(INDOOR_STEP_PAYLOAD_PREFIX.length);
  if (!encodedJson) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(encodedJson)) as IndoorStepPayload;
    return parsed;
  } catch {
    return null;
  }
}

export function resolveSearchSelectionBuildingCode(
  selection: SearchBuilding | null | undefined,
  buildings: BuildingInfo[],
) {
  if (!selection) {
    return null;
  }

  const buildingCodes = new Set(buildings.map((building) => building.buildingCode));
  const directCode = selection.parentBuildingCode ?? selection.buildingCode;
  if (buildingCodes.has(directCode)) {
    return directCode;
  }

  const inferred =
    inferIndoorBuildingCodeFromRoom(selection.buildingCode, buildings) ??
    inferIndoorBuildingCodeFromRoom(selection.buildingName, buildings);

  return inferred ?? null;
}

export async function enrichRoutesWithIndoorTransitions(
  routes: RoutesByTransportationMode,
  selections: IndoorSelections,
  buildings: BuildingInfo[],
  options: IndoorTransitionOptions = {},
): Promise<RoutesByTransportationMode> {
  const startIndoorSelection = toIndoorRoomSelection(selections.start, buildings);
  const endIndoorSelection = toIndoorRoomSelection(selections.end, buildings);

  if (!startIndoorSelection && !endIndoorSelection) {
    return routes;
  }

  const routeEntries = Object.entries(routes) as [
    TransportationMode,
    NormalizedRoute[] | null,
  ][];

  const nextEntries = await Promise.all(
    routeEntries.map(async ([mode, modeRoutes]) => {
      if (modeRoutes === null || !Array.isArray(modeRoutes)) {
        return [mode, null] as const;
      }

      const enrichedRoutes = await Promise.all(
        modeRoutes.map((route) =>
          enrichSingleRouteWithIndoorTransitions(
            route,
            startIndoorSelection,
            endIndoorSelection,
            options,
          ),
        ),
      );

      return [mode, enrichedRoutes] as const;
    }),
  );

  return Object.fromEntries(nextEntries) as RoutesByTransportationMode;
}

async function enrichSingleRouteWithIndoorTransitions(
  route: NormalizedRoute,
  startIndoorSelection: IndoorRoomSelection | null,
  endIndoorSelection: IndoorRoomSelection | null,
  options: IndoorTransitionOptions,
) {
  if (!route || !Array.isArray(route.legs)) {
    return route;
  }

  const [startIndoorStep, endIndoorStep] = await Promise.all([
    buildIndoorTransitionStep(startIndoorSelection, "start", options),
    buildIndoorTransitionStep(endIndoorSelection, "end", options),
  ]);

  if (!startIndoorStep && !endIndoorStep) {
    return route;
  }

  if (route.legs.length === 0) {
    return route;
  }

  const [firstLeg, ...remainingLegs] = route.legs;
  const baseSteps = Array.isArray(firstLeg?.steps) ? firstLeg.steps : [];
  const steps = [
    ...(startIndoorStep ? [startIndoorStep] : []),
    ...baseSteps,
    ...(endIndoorStep ? [endIndoorStep] : []),
  ];

  return {
    ...route,
    legs: [
      {
        ...firstLeg,
        steps,
      },
      ...remainingLegs,
    ],
  };
}

async function buildIndoorTransitionStep(
  selection: IndoorRoomSelection | null,
  direction: "start" | "end",
  options: IndoorTransitionOptions,
) {
  if (!selection) {
    return null;
  }

  if (!NavigationLoader.buildingHasNavigationData(selection.buildingCode)) {
    return null;
  }

  const floorInfo = await NavigationLoader.loadBuildingData(selection.buildingCode);
  if (!floorInfo) {
    return null;
  }

  const graph = floorInfo.graphData;
  const roomCheckpoint = findCheckpointForRoom(
    graph,
    selection.roomName,
    selection.buildingCode,
  );
  if (!roomCheckpoint) {
    return null;
  }

  const transition = findPreferredFeasibleEntryExit(
    graph,
    roomCheckpoint,
    direction,
    options,
  );
  if (!transition) {
    return null;
  }

  const transitionCheckpoint = transition.checkpoint;
  const path = transition.path;
  const checkpointCount = Math.max(path.length - 1, 1);
  const pathWeight = getPathWeight(graph, path);
  const transitionLabel = transitionCheckpoint.label?.trim() || transitionCheckpoint.id;
  const instruction =
    direction === "start"
      ? `Navigate indoors from room ${selection.roomName} to ${transitionLabel} in ${selection.buildingCode}.`
      : `Enter ${selection.buildingCode} via ${transitionLabel} and continue indoors to room ${selection.roomName}.`;
  const indoorDetails: IndoorStepPayload =
    direction === "start"
      ? {
          building_code: selection.buildingCode,
          start_room: selection.roomName,
          end_checkpoint_id: transitionCheckpoint.id,
        }
      : {
          building_code: selection.buildingCode,
          start_checkpoint_id: transitionCheckpoint.id,
          end_room: selection.roomName,
        };

  const step: NormalizedStep = {
    distance: {
      text: `${checkpointCount} indoor checkpoint${checkpointCount === 1 ? "" : "s"}`,
      value: pathWeight,
    },
    duration: {
      text: "Indoor segment",
      value: 0,
    },
    html_instructions: instruction,
    maneuver: "",
    polyline: { points: encodeIndoorStepPayload(indoorDetails) },
    travel_mode: INDOOR_TRAVEL_MODE,
    indoor_details: indoorDetails,
  };

  return step;
}

function toIndoorRoomSelection(
  selection: SearchBuilding | null,
  buildings: BuildingInfo[],
): IndoorRoomSelection | null {
  if (!selection) {
    return null;
  }

  const buildingCode = resolveSearchSelectionBuildingCode(selection, buildings);
  if (!buildingCode) {
    return null;
  }

  const roomName = (selection.roomName ?? selection.buildingName ?? "").trim();
  if (!roomName) {
    return null;
  }

  const isDirectRoomResult = Boolean(
    selection.isIndoorRoom || selection.parentBuildingCode || selection.roomName,
  );
  const isInferredRoomResult = buildingCode !== selection.buildingCode;

  if (!isDirectRoomResult && !isInferredRoomResult) {
    return null;
  }

  return {
    buildingCode,
    roomName,
  };
}

function findCheckpointForRoom(
  graph: FloorCheckpointsGraph,
  roomQuery: string,
  buildingCode: string,
) {
  const roomTokens = getRoomSearchTokens(roomQuery, buildingCode);
  if (roomTokens.length === 0) {
    return null;
  }

  const checkpoints = Object.values(graph.checkpoints);
  return (
    checkpoints.find((checkpoint) => {
      const checkpointTokens = getCheckpointTokens(checkpoint);
      return roomTokens.some((token) => checkpointTokens.includes(token));
    }) ?? null
  );
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

function findPreferredFeasibleEntryExit(
  graph: FloorCheckpointsGraph,
  roomCheckpoint: FloorCheckpoint,
  direction: "start" | "end",
  options: IndoorTransitionOptions,
) {
  const entryPoints = Object.values(graph.checkpoints).filter(
    (checkpoint) => checkpoint.type === "building_entry_exit",
  );
  if (entryPoints.length === 0) {
    return null;
  }

  const orderedEntryPoints = rankEntryExitCheckpoints(roomCheckpoint.floor, entryPoints);

  const feasibleCandidates: {
    checkpoint: FloorCheckpoint;
    path: string[];
    rank: number;
    pathWeight: number;
  }[] = [];

  for (const [rank, entryPoint] of orderedEntryPoints.entries()) {
    const path =
      direction === "start"
        ? findIndoorPath(graph, roomCheckpoint.id, entryPoint.id, options)
        : findIndoorPath(graph, entryPoint.id, roomCheckpoint.id, options);

    if (path) {
      feasibleCandidates.push({
        checkpoint: entryPoint,
        path,
        rank,
        pathWeight: getPathWeight(graph, path),
      });
    }
  }

  if (feasibleCandidates.length === 0) {
    return null;
  }

  // Choose the shortest feasible indoor path for both indoor->outdoor and outdoor->indoor.
  feasibleCandidates.sort((a, b) => a.pathWeight - b.pathWeight || a.rank - b.rank);

  return feasibleCandidates[0];
}

function rankEntryExitCheckpoints(roomFloor: number, entryPoints: FloorCheckpoint[]) {
  return [...entryPoints].sort((a, b) => {
    const floorDistanceDiff =
      Math.abs(a.floor - roomFloor) - Math.abs(b.floor - roomFloor);
    if (floorDistanceDiff !== 0) {
      return floorDistanceDiff;
    }

    if (a.accessible !== b.accessible) {
      return Number(b.accessible) - Number(a.accessible);
    }

    const entryOrderDiff = compareNumbers(getEntryExitOrder(a), getEntryExitOrder(b));
    if (entryOrderDiff !== 0) {
      return entryOrderDiff;
    }

    return a.id.localeCompare(b.id, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

function getEntryExitOrder(checkpoint: FloorCheckpoint) {
  const sources = [checkpoint.label ?? "", checkpoint.id].join(" ");
  const explicitEntryExitMatch = /(?:ENTRY\s*EXIT|BUILDINGENTRYEXIT)\D*(\d+)/i.exec(
    sources,
  );
  if (explicitEntryExitMatch?.[1]) {
    return Number(explicitEntryExitMatch[1]);
  }

  const lastNumberMatch = /(\d+)(?!.*\d)/.exec(sources);
  if (!lastNumberMatch?.[1]) {
    return Number.POSITIVE_INFINITY;
  }

  return Number(lastNumberMatch[1]);
}

function compareNumbers(a: number, b: number) {
  const aIsFinite = Number.isFinite(a);
  const bIsFinite = Number.isFinite(b);

  if (aIsFinite && bIsFinite) {
    return a - b;
  }
  if (aIsFinite) {
    return -1;
  }
  if (bIsFinite) {
    return 1;
  }
  return 0;
}

function getPathWeight(graph: FloorCheckpointsGraph, path: string[]) {
  let weight = 0;
  for (let index = 0; index < path.length - 1; index++) {
    const source = path[index];
    const target = path[index + 1];
    const edge = graph.adjacencySet[source]?.[target];
    weight += edge?.weight ?? 1;
  }
  return weight;
}

function inferIndoorBuildingCodeFromRoom(
  roomCandidate: string,
  buildings: BuildingInfo[],
) {
  const normalizedCandidate = normalizeSearchToken(roomCandidate);
  if (!normalizedCandidate) {
    return undefined;
  }

  const indoorBuildingCodes = buildings
    .map((building) => building.buildingCode)
    .filter((buildingCode) => NavigationLoader.buildingHasNavigationData(buildingCode))
    .sort((a, b) => b.length - a.length);

  return indoorBuildingCodes.find((buildingCode) =>
    normalizedCandidate.startsWith(normalizeSearchToken(buildingCode)),
  );
}
