import { TransportationMode } from "@/types/buildingTypes";
import { BuildingCode, Coordinate, FloorCheckpointId, FloorCheckpointsGraph, IndoorNavigationPath,} from "@/types/mapTypes";
import { decodePolyline } from "@/utils/decodePolyline";
import { fetchAllDirections, NormalizedRoute } from "@/utils/directions";
import { findIndoorPath, findNearestEntryExitPath } from "@/utils/indoorNavigation";

// Used to know which phase of the nav the user is in.
export type HybridNavigationPhase =
  | "INDOOR_START"
  | "OUTDOOR"
  | "INDOOR_DEST"
  | "DONE"
  | "ERROR";

export type IndoorRouteSegment = {
  type: "indoor";
  buildingCode: BuildingCode;
  startNodeId: FloorCheckpointId;
  endNodeId: FloorCheckpointId;
  path: IndoorNavigationPath;
};

export type OutdoorRouteSegment = {
  type: "outdoor";
  mode: TransportationMode;
  from: Coordinate;
  to: Coordinate;
  route: NormalizedRoute;
  polyline: Coordinate[];
};

export type HybridRoute = {
  startBuilding: BuildingCode;
  destinationBuilding: BuildingCode;
  sameBuilding: boolean;
  segments: (IndoorRouteSegment | OutdoorRouteSegment)[];
  initialPhase: HybridNavigationPhase;
};

// Maps entry/exit checkpoint IDs to outdoor coordinates for one building.
type EntryExitCoordinateMap = Partial<Record<FloorCheckpointId, Coordinate>>;

// Maps building codes to their available indoor/outdoor bridge points.
export type IndoorOutdoorBridgeMap = Partial<
  Record<BuildingCode, EntryExitCoordinateMap>
>;

export type BuildHybridRouteParams = {
  startBuilding: BuildingCode;
  destinationBuilding: BuildingCode;
  startRoomNodeId: FloorCheckpointId;
  destinationRoomNodeId: FloorCheckpointId;
  startGraph: FloorCheckpointsGraph;
  destinationGraph: FloorCheckpointsGraph;
  bridgeMap: IndoorOutdoorBridgeMap;
  preferredOutdoorMode?: TransportationMode;
};

const OUTDOOR_MODE_PRIORITY: TransportationMode[] = [
  "walking",
  "transit",
  "driving",
  "bicycling",
  "shuttle",
];

// For indoor outdoor nav
export async function buildHybridRoute(
  params: BuildHybridRouteParams,
): Promise<HybridRoute> {
  const {
    startBuilding,
    destinationBuilding,
    startRoomNodeId,
    destinationRoomNodeId,
    startGraph,
    destinationGraph,
    bridgeMap,
    preferredOutdoorMode,
  } = params;

  // If start and destination rooms are in the same, no route to produce so return empty route with DONE immediately.
  if (
    startBuilding === destinationBuilding &&
    startRoomNodeId === destinationRoomNodeId
  ) {
    return {
      startBuilding,
      destinationBuilding,
      sameBuilding: true,
      segments: [],
      initialPhase: "DONE",
    };
  }

  // If start and destination rooms are in the same building, no outdoor nav, just room to room path.
  if (startBuilding === destinationBuilding) {
    const path = findIndoorPath(startGraph, startRoomNodeId, destinationRoomNodeId);
    if (!path) {
      throw new Error("No indoor path found between start and destination rooms");
    }

    return {
      startBuilding,
      destinationBuilding,
      sameBuilding: true,
      segments: [
        {
          type: "indoor",
          buildingCode: startBuilding,
          startNodeId: startRoomNodeId,
          endNodeId: destinationRoomNodeId,
          path,
        },
      ],
      initialPhase: "INDOOR_START",
    };
  }

  // The rest is a bit longer, we need indoor paths of start and destination buildings + we need outdoor path from building to building
  const startToExitPath = findNearestEntryExitPath(startGraph, startRoomNodeId);
  if (!startToExitPath || startToExitPath.length === 0) {
    throw new Error("No reachable start building entry/exit from start room");
  }

  const destinationRoomToEntryPath = findNearestEntryExitPath(destinationGraph,destinationRoomNodeId,);
  if (!destinationRoomToEntryPath || destinationRoomToEntryPath.length === 0) {
    throw new Error(
      "No reachable destination building entry/exit from destination room",
    );
  }

  const startExitNodeId = startToExitPath[startToExitPath.length - 1];
  const destinationEntryNodeId =
    destinationRoomToEntryPath[destinationRoomToEntryPath.length - 1];

  const startExitCoordinate = bridgeMap[startBuilding]?.[startExitNodeId];
  if (!startExitCoordinate) {
    throw new Error(
      `Missing indoor-outdoor bridge coordinate for start exit node: ${startExitNodeId}`,
    );
  }

  const destinationEntryCoordinate =
    bridgeMap[destinationBuilding]?.[destinationEntryNodeId];
  if (!destinationEntryCoordinate) {
    throw new Error(
      `Missing indoor-outdoor bridge coordinate for destination entry node: ${destinationEntryNodeId}`,
    );
  }

  // Allow user to choose prefered outdoor nav mode of travel.
  const outdoorCandidates = await fetchAllDirections(
    startExitCoordinate,
    destinationEntryCoordinate,
  );
  const [selectedOutdoorMode, selectedOutdoorRoute] = selectOutdoorRoute(
    outdoorCandidates,
    preferredOutdoorMode,
  );

  if (!selectedOutdoorMode || !selectedOutdoorRoute) {
    throw new Error("No outdoor route found between selected entry/exit points");
  }

  const outdoorPolyline = decodePolyline(selectedOutdoorRoute.overview_polyline.points);

  const destinationEntryToRoomPath = [...destinationRoomToEntryPath].reverse(); // makes path go from entry to room instead of room to entry


  /* Represents path from start building room to nearest exit, 
   * then outdoor path, 
   * then path from nearest entry to destination room 
  */
  return {
    startBuilding,
    destinationBuilding,
    sameBuilding: false,
    segments: [
      {
        type: "indoor",
        buildingCode: startBuilding,
        startNodeId: startRoomNodeId,
        endNodeId: startExitNodeId,
        path: startToExitPath,
      },
      {
        type: "outdoor",
        mode: selectedOutdoorMode,
        from: startExitCoordinate,
        to: destinationEntryCoordinate,
        route: selectedOutdoorRoute,
        polyline: outdoorPolyline,
      },
      {
        type: "indoor",
        buildingCode: destinationBuilding,
        startNodeId: destinationEntryNodeId,
        endNodeId: destinationRoomNodeId,
        path: destinationEntryToRoomPath,
      },
    ],
    initialPhase: "INDOOR_START",
  };
}

// To find the user's next phase, important for user feedback,transitions and UI updates
export function getNextHybridPhase(
  current: HybridNavigationPhase,
  route: HybridRoute,
): HybridNavigationPhase {
  if (current === "DONE" || current === "ERROR") {
    return current;
  }

  if (route.sameBuilding) {
    return current === "INDOOR_START" ? "DONE" : current;
  }

  if (current === "INDOOR_START") {
    return "OUTDOOR";
  }
  if (current === "OUTDOOR") {
    return "INDOOR_DEST";
  }
  if (current === "INDOOR_DEST") {
    return "DONE";
  }

  return current;
}

function selectOutdoorRoute(
  allOutdoorRoutes: Record<TransportationMode, NormalizedRoute[] | null>,
  preferredOutdoorMode?: TransportationMode,
): [TransportationMode | null, NormalizedRoute | null] {
  if (preferredOutdoorMode) {
    const preferredRoutes = allOutdoorRoutes[preferredOutdoorMode];
    if (preferredRoutes && preferredRoutes.length > 0) {
      return [preferredOutdoorMode, preferredRoutes[0]];
    }
  }

  for (const mode of OUTDOOR_MODE_PRIORITY) {
    const routes = allOutdoorRoutes[mode];
    if (routes && routes.length > 0) {
      return [mode, routes[0]];
    }
  }

  return [null, null];
}
