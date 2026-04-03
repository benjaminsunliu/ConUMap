import {
  FloorCheckpoint,
  FloorCheckpointsGraph,
  IndoorNavigationPath,
} from "@/types/mapTypes";

type IndoorStepInstructionOptions = {
  graph: FloorCheckpointsGraph;
  path: IndoorNavigationPath;
  stepIndex: number;
  nextStepIndex?: number;
  startLabel?: string;
  endLabel?: string;
};

type FloorDirection = "up" | "down";
const INDOOR_EDGE_TYPES = {
  DOOR_TO_HALLWAY: "door_to_hallway",
  ELEVATOR: "elevator",
  ESCALATOR: "escalator",
  ROOM_TO_DOOR: "room_to_door",
  STAIR: "stair",
} as const;

type IndoorEdgeType = (typeof INDOOR_EDGE_TYPES)[keyof typeof INDOOR_EDGE_TYPES];

const TURN_ANGLE_THRESHOLDS = {
  CONTINUE_STRAIGHT: 20,
  KEEP_TURN: 55,
  STANDARD_TURN: 140,
  SHARP_TURN: 170,
} as const;

// Returns undefined when there is no reliable user-facing instruction for the
// current graph/path state.
export function describeIndoorStep({
  graph,
  path,
  stepIndex,
  nextStepIndex,
  startLabel,
  endLabel,
}: IndoorStepInstructionOptions): string | undefined {
  if (!Array.isArray(path) || path.length === 0) {
    return undefined;
  }

  const boundedStepIndex = Math.min(Math.max(stepIndex, 0), path.length - 1);
  const current = graph.checkpoints[path[boundedStepIndex]];
  if (!current) {
    return undefined;
  }

  if (boundedStepIndex >= path.length - 1) {
    const destinationLabel = endLabel?.trim() || getCheckpointDisplayName(current);
    return destinationLabel
      ? `Arrive at ${destinationLabel}.`
      : "Arrive at your destination.";
  }

  const boundedNextStepIndex = Math.min(
    Math.max(nextStepIndex ?? boundedStepIndex + 1, boundedStepIndex + 1),
    path.length - 1,
  );
  const next = graph.checkpoints[path[boundedNextStepIndex]];
  if (!next) {
    return undefined;
  }
  const previous =
    boundedStepIndex > 0 ? graph.checkpoints[path[boundedStepIndex - 1]] : undefined;
  const edgeType = getSegmentEdgeType(
    graph,
    path,
    boundedStepIndex,
    boundedNextStepIndex,
  );
  const usesEscalator = segmentUsesEscalator(
    graph,
    path,
    boundedStepIndex,
    boundedNextStepIndex,
  );

  const verticalInstruction = getVerticalInstruction(
    current,
    next,
    edgeType,
    usesEscalator,
  );
  if (verticalInstruction) {
    return verticalInstruction;
  }

  if (edgeType === INDOOR_EDGE_TYPES.ROOM_TO_DOOR) {
    return "Exit the room and continue to the hallway.";
  }
  if (edgeType === INDOOR_EDGE_TYPES.DOOR_TO_HALLWAY) {
    return "Continue through the doorway.";
  }

  if (!previous) {
    const normalizedStart = startLabel?.trim();
    if (normalizedStart) {
      return `Start at ${normalizedStart}. Continue straight.`;
    }
    return "Start and continue straight.";
  }

  return getTurnInstruction(previous, current, next);
}

function getVerticalInstruction(
  current: FloorCheckpoint,
  next: FloorCheckpoint,
  edgeType: IndoorEdgeType | undefined,
  segmentUsesEscalator = false,
): string | undefined {
  const floorDelta = next.floor - current.floor;
  const floorDirection = getFloorDirection(floorDelta);
  const nextFloorLabel = formatFloor(next.floor);
  const usesEscalator =
    segmentUsesEscalator ||
    current.type === INDOOR_EDGE_TYPES.ESCALATOR ||
    next.type === INDOOR_EDGE_TYPES.ESCALATOR;

  if (edgeType === INDOOR_EDGE_TYPES.ELEVATOR) {
    return getVerticalTravelInstruction("elevator", floorDirection, nextFloorLabel);
  }

  if (edgeType === INDOOR_EDGE_TYPES.STAIR) {
    return getVerticalTravelInstruction(
      usesEscalator ? "escalator" : "stairs",
      floorDirection,
      nextFloorLabel,
    );
  }

  if (edgeType === INDOOR_EDGE_TYPES.ESCALATOR) {
    return getVerticalTravelInstruction("escalator", floorDirection, nextFloorLabel);
  }

  if (usesEscalator && floorDirection) {
    return getVerticalTravelInstruction("escalator", floorDirection, nextFloorLabel);
  }

  if (floorDirection) {
    return `Go ${floorDirection} to Floor ${nextFloorLabel}.`;
  }

  return undefined;
}

function getFloorDirection(floorDelta: number): FloorDirection | undefined {
  if (floorDelta > 0) {
    return "up";
  }

  if (floorDelta < 0) {
    return "down";
  }

  return undefined;
}

function getVerticalTravelInstruction(
  travelMethod: "elevator" | "stairs" | "escalator",
  floorDirection: FloorDirection | undefined,
  nextFloorLabel: string,
) {
  if (!floorDirection) {
    return `Take the ${travelMethod}.`;
  }

  return `Take the ${travelMethod} ${floorDirection} to Floor ${nextFloorLabel}.`;
}

function getSegmentEdgeType(
  graph: FloorCheckpointsGraph,
  path: IndoorNavigationPath,
  startIndex: number,
  endIndex: number,
): IndoorEdgeType | undefined {
  if (endIndex <= startIndex) {
    return undefined;
  }

  const edgeTypes = new Set<IndoorEdgeType>();
  for (let i = startIndex; i < endIndex; i++) {
    const from = graph.checkpoints[path[i]];
    const to = graph.checkpoints[path[i + 1]];
    if (!from || !to) {
      continue;
    }
    const edgeType = normalizeIndoorEdgeType(graph.adjacencySet[from.id]?.[to.id]?.type);
    if (edgeType) {
      edgeTypes.add(edgeType);
    }
  }

  if (edgeTypes.has(INDOOR_EDGE_TYPES.ELEVATOR)) {
    return INDOOR_EDGE_TYPES.ELEVATOR;
  }
  if (edgeTypes.has(INDOOR_EDGE_TYPES.STAIR)) {
    return INDOOR_EDGE_TYPES.STAIR;
  }
  if (edgeTypes.has(INDOOR_EDGE_TYPES.ESCALATOR)) {
    return INDOOR_EDGE_TYPES.ESCALATOR;
  }
  if (edgeTypes.has(INDOOR_EDGE_TYPES.ROOM_TO_DOOR)) {
    return INDOOR_EDGE_TYPES.ROOM_TO_DOOR;
  }
  if (edgeTypes.has(INDOOR_EDGE_TYPES.DOOR_TO_HALLWAY)) {
    return INDOOR_EDGE_TYPES.DOOR_TO_HALLWAY;
  }
  return undefined;
}

function normalizeIndoorEdgeType(edgeType: string | undefined): IndoorEdgeType | undefined {
  switch (edgeType) {
    case INDOOR_EDGE_TYPES.DOOR_TO_HALLWAY:
    case INDOOR_EDGE_TYPES.ELEVATOR:
    case INDOOR_EDGE_TYPES.ESCALATOR:
    case INDOOR_EDGE_TYPES.ROOM_TO_DOOR:
    case INDOOR_EDGE_TYPES.STAIR:
      return edgeType;
    default:
      return undefined;
  }
}

function segmentUsesEscalator(
  graph: FloorCheckpointsGraph,
  path: IndoorNavigationPath,
  startIndex: number,
  endIndex: number,
) {
  for (let i = startIndex; i <= endIndex; i++) {
    const checkpoint = graph.checkpoints[path[i]];
    if (checkpoint?.type === INDOOR_EDGE_TYPES.ESCALATOR) {
      return true;
    }
  }
  return false;
}

function getTurnInstruction(
  previous: FloorCheckpoint,
  current: FloorCheckpoint,
  next: FloorCheckpoint,
) {
  const vectorIn = {
    x: current.x - previous.x,
    y: current.y - previous.y,
  };
  const vectorOut = {
    x: next.x - current.x,
    y: next.y - current.y,
  };

  const incomingMagnitude = Math.hypot(vectorIn.x, vectorIn.y);
  const outgoingMagnitude = Math.hypot(vectorOut.x, vectorOut.y);
  if (incomingMagnitude === 0 || outgoingMagnitude === 0) {
    return "Continue straight.";
  }

  const cross = vectorIn.x * vectorOut.y - vectorIn.y * vectorOut.x;
  const dot = vectorIn.x * vectorOut.x + vectorIn.y * vectorOut.y;
  // Indoor map coordinates use y-down screen space, so we invert the sign
  // to get intuitive left/right turn language.
  const signedAngleDegrees = (-Math.atan2(cross, dot) * 180) / Math.PI;
  const absAngleDegrees = Math.abs(signedAngleDegrees);
  const isLeftTurn = signedAngleDegrees > 0;

  if (absAngleDegrees < TURN_ANGLE_THRESHOLDS.CONTINUE_STRAIGHT) {
    return "Continue straight.";
  }
  if (absAngleDegrees < TURN_ANGLE_THRESHOLDS.KEEP_TURN) {
    return isLeftTurn ? "Keep left." : "Keep right.";
  }
  if (absAngleDegrees < TURN_ANGLE_THRESHOLDS.STANDARD_TURN) {
    return isLeftTurn ? "Turn left." : "Turn right.";
  }
  if (absAngleDegrees < TURN_ANGLE_THRESHOLDS.SHARP_TURN) {
    return isLeftTurn ? "Make a sharp left." : "Make a sharp right.";
  }
  return "Turn around.";
}

function getCheckpointDisplayName(checkpoint: FloorCheckpoint) {
  const label = checkpoint.label?.trim();
  if (label) {
    return label;
  }
  return checkpoint.id;
}

function formatFloor(floor: number) {
  if (floor < 0) {
    return `B${Math.abs(floor)}`;
  }
  return `${floor}`;
}
