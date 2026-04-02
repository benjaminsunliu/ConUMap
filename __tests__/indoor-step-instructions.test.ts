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

  it("returns an empty instruction for empty or invalid path steps", () => {
    expect(
      describeIndoorStep({
        graph,
        path: [],
        stepIndex: 0,
      }),
    ).toBe("");

    expect(
      describeIndoorStep({
        graph,
        path: ["missing"],
        stepIndex: 0,
      }),
    ).toBe("");

    expect(
      describeIndoorStep({
        graph,
        path: ["A", "missing"],
        stepIndex: 0,
      }),
    ).toBe("");
  });

  it("describes doorway transitions and the default start instruction", () => {
    const doorwayGraph: FloorCheckpointsGraph = {
      ...graph,
      adjacencySet: {
        ...graph.adjacencySet,
        A: {
          B: {
            ...graph.adjacencySet.A.B,
            type: "room_to_door",
          },
        },
        B: {
          C: {
            ...graph.adjacencySet.B.C,
            type: "door_to_hallway",
          },
        },
      },
    };

    expect(
      describeIndoorStep({
        graph: doorwayGraph,
        path: ["A", "B"],
        stepIndex: 0,
      }),
    ).toBe("Exit the room and continue to the hallway.");

    expect(
      describeIndoorStep({
        graph: doorwayGraph,
        path: ["B", "C"],
        stepIndex: 0,
      }),
    ).toBe("Continue through the doorway.");

    expect(
      describeIndoorStep({
        graph,
        path: ["A", "B"],
        stepIndex: 0,
        startLabel: "   ",
      }),
    ).toBe("Start and continue straight.");
  });

  it("handles elevator, stair, escalator, and generic floor-change instructions", () => {
    const verticalGraph: FloorCheckpointsGraph = {
      checkpoints: {
        ...graph.checkpoints,
        ST1_SAME: {
          ...graph.checkpoints.ST1,
          id: "ST1_SAME",
          floor: 1,
        },
        ES2_ESC: {
          ...graph.checkpoints.ES2,
          id: "ES2_ESC",
        },
        ES1_SAME: {
          ...graph.checkpoints.ES1,
          id: "ES1_SAME",
          floor: 1,
        },
        EL1_SAME: {
          ...graph.checkpoints.EL1,
          id: "EL1_SAME",
          floor: 1,
        },
        F1: {
          id: "F1",
          type: "hallway_waypoint",
          buildingId: "H",
          floor: 1,
          x: 30,
          y: 200,
          accessible: true,
        },
        B1: {
          id: "B1",
          type: "hallway_waypoint",
          buildingId: "H",
          floor: -1,
          x: 30,
          y: 260,
          accessible: true,
        },
      },
      adjacencySet: {
        ...graph.adjacencySet,
        ST1: {
          ST1_SAME: {
            source: "ST1",
            target: "ST1_SAME",
            type: "stair",
            weight: 1,
            accessible: true,
          },
        },
        ES1: {
          ES1_SAME: {
            source: "ES1",
            target: "ES1_SAME",
            type: "stair",
            weight: 1,
            accessible: true,
          },
          ES2_ESC: {
            source: "ES1",
            target: "ES2_ESC",
            type: "escalator",
            weight: 1,
            accessible: true,
          },
        },
        EL1: {
          EL1_SAME: {
            source: "EL1",
            target: "EL1_SAME",
            type: "elevator",
            weight: 1,
            accessible: true,
          },
        },
        F1: {
          B1: {
            source: "F1",
            target: "B1",
            type: "hallway",
            weight: 1,
            accessible: true,
          },
        },
        B1: {},
        ST1_SAME: {},
        ES1_SAME: {},
        ES2_ESC: {},
        EL1_SAME: {},
      },
    };

    expect(
      describeIndoorStep({
        graph: verticalGraph,
        path: ["EL1", "EL1_SAME"],
        stepIndex: 0,
      }),
    ).toBe("Take the elevator.");

    expect(
      describeIndoorStep({
        graph: verticalGraph,
        path: ["ST1", "ST1_SAME"],
        stepIndex: 0,
      }),
    ).toBe("Take the stairs.");

    expect(
      describeIndoorStep({
        graph: verticalGraph,
        path: ["ES1", "ES1_SAME"],
        stepIndex: 0,
      }),
    ).toBe("Take the escalator.");

    expect(
      describeIndoorStep({
        graph: verticalGraph,
        path: ["ES1", "ES2_ESC"],
        stepIndex: 0,
      }),
    ).toBe("Take the escalator up to Floor 2.");

    expect(
      describeIndoorStep({
        graph: verticalGraph,
        path: ["F1", "B1"],
        stepIndex: 0,
      }),
    ).toBe("Go down to Floor B1.");
  });

  it("covers keep, sharp, and turnaround turn instructions", () => {
    const turningGraph: FloorCheckpointsGraph = {
      checkpoints: {
        ...graph.checkpoints,
        KR: {
          id: "KR",
          type: "hallway_waypoint",
          buildingId: "H",
          floor: 1,
          x: 140,
          y: 30,
          accessible: true,
        },
        SL: {
          id: "SL",
          type: "hallway_waypoint",
          buildingId: "H",
          floor: 1,
          x: 40,
          y: -20,
          accessible: true,
        },
        TURN: {
          id: "TURN",
          type: "hallway_waypoint",
          buildingId: "H",
          floor: 1,
          x: 0,
          y: 0,
          accessible: true,
        },
      },
      adjacencySet: {
        ...graph.adjacencySet,
        B: {
          ...graph.adjacencySet.B,
          KR: {
            source: "B",
            target: "KR",
            type: "hallway",
            weight: 1,
            accessible: true,
          },
          SL: {
            source: "B",
            target: "SL",
            type: "hallway",
            weight: 1,
            accessible: true,
          },
          TURN: {
            source: "B",
            target: "TURN",
            type: "hallway",
            weight: 1,
            accessible: true,
          },
        },
        KR: {},
        SL: {},
        TURN: {},
      },
    };

    expect(
      describeIndoorStep({
        graph: turningGraph,
        path: ["A", "B", "KR"],
        stepIndex: 1,
      }),
    ).toBe("Keep right.");

    expect(
      describeIndoorStep({
        graph: turningGraph,
        path: ["A", "B", "SL"],
        stepIndex: 1,
      }),
    ).toBe("Make a sharp left.");

    expect(
      describeIndoorStep({
        graph: turningGraph,
        path: ["A", "B", "TURN"],
        stepIndex: 1,
      }),
    ).toBe("Turn around.");
  });

  it("falls back to the checkpoint id when arriving without a label", () => {
    const instruction = describeIndoorStep({
      graph,
      path: ["A", "B"],
      stepIndex: 1,
    });

    expect(instruction).toBe("Arrive at B.");
  });
});
