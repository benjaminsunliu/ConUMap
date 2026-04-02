import { describeIndoorStep } from "@/utils/indoorStepInstructions";
import { FloorCheckpointsGraph } from "@/types/mapTypes";

describe("describeIndoorStep", () => {
  const graph: FloorCheckpointsGraph = {
    checkpoints: {
      A: {
        id: "A",
        type: "doorway",
        buildingId: "H",
        floor: 1,
        x: 0,
        y: 0,
        label: "H110",
        accessible: true,
      },
      B: {
        id: "B",
        type: "hallway_waypoint",
        buildingId: "H",
        floor: 1,
        x: 100,
        y: 0,
        accessible: true,
      },
      C: {
        id: "C",
        type: "hallway_waypoint",
        buildingId: "H",
        floor: 1,
        x: 200,
        y: 0,
        accessible: true,
      },
      D: {
        id: "D",
        type: "hallway_waypoint",
        buildingId: "H",
        floor: 1,
        x: 100,
        y: 120,
        accessible: true,
      },
      ST1: {
        id: "ST1",
        type: "stair_landing",
        buildingId: "H",
        floor: 1,
        x: 0,
        y: 100,
        accessible: true,
      },
      ST2: {
        id: "ST2",
        type: "stair_landing",
        buildingId: "H",
        floor: 2,
        x: 0,
        y: 100,
        accessible: true,
      },
      ST3: {
        id: "ST3",
        type: "stair_landing",
        buildingId: "H",
        floor: 3,
        x: 0,
        y: 100,
        accessible: true,
      },
      ES1: {
        id: "ES1",
        type: "escalator",
        buildingId: "H",
        floor: 1,
        x: 10,
        y: 100,
        accessible: true,
      },
      ES2: {
        id: "ES2",
        type: "escalator",
        buildingId: "H",
        floor: 2,
        x: 10,
        y: 100,
        accessible: true,
      },
      EL1: {
        id: "EL1",
        type: "elevator_door",
        buildingId: "H",
        floor: 1,
        x: 20,
        y: 100,
        accessible: true,
      },
      EL2: {
        id: "EL2",
        type: "elevator_door",
        buildingId: "H",
        floor: 3,
        x: 20,
        y: 100,
        accessible: true,
      },
    },
    adjacencySet: {
      A: {
        B: {
          source: "A",
          target: "B",
          type: "hallway",
          weight: 1,
          accessible: true,
        },
      },
      B: {
        C: {
          source: "B",
          target: "C",
          type: "hallway",
          weight: 1,
          accessible: true,
        },
        D: {
          source: "B",
          target: "D",
          type: "hallway",
          weight: 1,
          accessible: true,
        },
      },
      C: {},
      D: {},
      ST1: {
        ST2: {
          source: "ST1",
          target: "ST2",
          type: "stair",
          weight: 1,
          accessible: true,
        },
      },
      ST2: {
        ST3: {
          source: "ST2",
          target: "ST3",
          type: "stair",
          weight: 1,
          accessible: true,
        },
      },
      ST3: {},
      ES1: {
        ES2: {
          source: "ES1",
          target: "ES2",
          type: "stair",
          weight: 1,
          accessible: true,
        },
      },
      ES2: {},
      EL1: {
        EL2: {
          source: "EL1",
          target: "EL2",
          type: "elevator",
          weight: 1,
          accessible: true,
        },
      },
      EL2: {},
    },
  };

  it("returns a straight instruction for colinear hallway steps", () => {
    const instruction = describeIndoorStep({
      graph,
      path: ["A", "B", "C"],
      stepIndex: 1,
    });

    expect(instruction).toBe("Continue straight.");
  });

  it("returns a right-turn instruction when path bends right", () => {
    const instruction = describeIndoorStep({
      graph,
      path: ["A", "B", "D"],
      stepIndex: 1,
    });

    expect(instruction).toBe("Turn right.");
  });

  it("describes stairs and floor changes", () => {
    const instruction = describeIndoorStep({
      graph,
      path: ["ST1", "ST2"],
      stepIndex: 0,
    });

    expect(instruction).toBe("Take the stairs up to Floor 2.");
  });

  it("describes the final target floor when skipping intermediate stair checkpoints", () => {
    const instruction = describeIndoorStep({
      graph,
      path: ["ST1", "ST2", "ST3"],
      stepIndex: 0,
      nextStepIndex: 2,
    });

    expect(instruction).toBe("Take the stairs up to Floor 3.");
  });

  it("describes escalators when escalator nodes are used", () => {
    const instruction = describeIndoorStep({
      graph,
      path: ["ES1", "ES2"],
      stepIndex: 0,
    });

    expect(instruction).toBe("Take the escalator up to Floor 2.");
  });

  it("describes elevators and target floor", () => {
    const instruction = describeIndoorStep({
      graph,
      path: ["EL1", "EL2"],
      stepIndex: 0,
    });

    expect(instruction).toBe("Take the elevator up to Floor 3.");
  });

  it("describes arrival on the final step", () => {
    const instruction = describeIndoorStep({
      graph,
      path: ["A", "B"],
      stepIndex: 1,
      endLabel: "H820",
    });

    expect(instruction).toBe("Arrive at H820.");
  });
});
