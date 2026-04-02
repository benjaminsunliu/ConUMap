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

export function describeIndoorStep({
  graph,
  path,
  stepIndex,
  nextStepIndex,
  startLabel,
  endLabel,
}: IndoorStepInstructionOptions) {
  if (!Array.isArray(path) || path.length === 0) {
    return "";
  }

  const boundedStepIndex = Math.min(Math.max(stepIndex, 0), path.length - 1);
  const current = graph.checkpoints[path[boundedStepIndex]];
  if (!current) {
    return "";
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
    return "";
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

  if (edgeType === "room_to_door") {
    return "Exit the room and continue to the hallway.";
  }
  if (edgeType === "door_to_hallway") {
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
  edgeType: string,
  segmentUsesEscalator = false,
) {
  const floorDelta = next.floor - current.floor;
  const floorDirection = getFloorDirection(floorDelta);
  const nextFloorLabel = formatFloor(next.floor);
  const usesEscalator =
    segmentUsesEscalator || current.type === "escalator" || next.type === "escalator";

  if (edgeType === "elevator") {
    return getVerticalTravelInstruction("elevator", floorDirection, nextFloorLabel);
  }

  if (edgeType === "stair") {
    return getVerticalTravelInstruction(
      usesEscalator ? "escalator" : "stairs",
      floorDirection,
      nextFloorLabel,
    );
  }

  if (usesEscalator && floorDirection) {
    return getVerticalTravelInstruction("escalator", floorDirection, nextFloorLabel);
  }

  if (floorDirection) {
    return `Go ${floorDirection} to Floor ${nextFloorLabel}.`;
  }

  return "";
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
) {
  if (endIndex <= startIndex) {
    return "";
  }

  const edgeTypes = new Set<string>();
  for (let i = startIndex; i < endIndex; i++) {
    const from = graph.checkpoints[path[i]];
    const to = graph.checkpoints[path[i + 1]];
    if (!from || !to) {
      continue;
    }
    const edgeType = graph.adjacencySet[from.id]?.[to.id]?.type;
    if (edgeType) {
      edgeTypes.add(edgeType);
    }
  }

  if (edgeTypes.has("elevator")) {
    return "elevator";
  }
  if (edgeTypes.has("stair")) {
    return "stair";
  }
  if (edgeTypes.has("escalator")) {
    return "escalator";
  }
  if (edgeTypes.size > 0) {
    return [...edgeTypes][0];
  }
  return "";
}

function segmentUsesEscalator(
  graph: FloorCheckpointsGraph,
  path: IndoorNavigationPath,
  startIndex: number,
  endIndex: number,
) {
  for (let i = startIndex; i <= endIndex; i++) {
    const checkpoint = graph.checkpoints[path[i]];
    if (checkpoint?.type === "escalator") {
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

  if (absAngleDegrees < 20) {
    return "Continue straight.";
  }
  if (absAngleDegrees < 55) {
    return isLeftTurn ? "Keep left." : "Keep right.";
  }
  if (absAngleDegrees < 140) {
    return isLeftTurn ? "Turn left." : "Turn right.";
  }
  if (absAngleDegrees < 170) {
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
