import { findIndoorPath } from "@/utils/indoorNavigation"; // Adjust path accordingly
import {
  FloorCheckpointAdjancencySet,
  FloorCheckpointConnection,
  FloorCheckpointsGraph,
} from "@/types/mapTypes";

describe("findPathFromRoomToRoom (Undirected Graph)", () => {
  type TestEdge = [
    string,
    string,
    number,
    Partial<FloorCheckpointConnection>?,
  ];

  const buildUndirectedGraph = (
    edges: TestEdge[],
  ): FloorCheckpointsGraph => {
    const adjacencySet: FloorCheckpointAdjancencySet = {};
    const defaultEdge: FloorCheckpointConnection = {
      accessible: true,
      source: "",
      target: "",
      type: "",
      weight: Infinity,
    };

    edges.forEach(([u, v, weight, overrides]) => {
      if (!adjacencySet[u]) adjacencySet[u] = {};
      if (!adjacencySet[v]) adjacencySet[v] = {};
      adjacencySet[u][v] = {
        ...defaultEdge,
        source: u,
        target: v,
        weight,
        ...overrides,
      };
      adjacencySet[v][u] = {
        ...defaultEdge,
        source: v,
        target: u,
        weight,
        ...overrides,
      };
    });
    return { adjacencySet, checkpoints: {} };
  };

  const graph = buildUndirectedGraph([
    ["Lobby", "Elevator", 2],
    ["Elevator", "Hallway-1", 1],
    ["Hallway-1", "Room-101", 3],
    ["Hallway-1", "Room-102", 5],
    ["Lobby", "Room-102", 10],
  ]);

  it("should find a path in both directions (Symmetry)", () => {
    const forward = findIndoorPath(graph, "Lobby", "Room-101");
    const backward = findIndoorPath(graph, "Room-101", "Lobby");

    expect(forward).toEqual(["Lobby", "Elevator", "Hallway-1", "Room-101"]);
    expect(backward).toEqual(["Room-101", "Hallway-1", "Elevator", "Lobby"]);
  });

  it("should prioritize the shorter weighted path, even if it has more steps", () => {
    // Direct Lobby -> Room-102 is weight 10.
    // Lobby -> Elevator -> Hallway-1 -> Room-102 is weight (2+1+5) = 8.
    const path = findIndoorPath(graph, "Lobby", "Room-102");

    expect(path).toEqual(["Lobby", "Elevator", "Hallway-1", "Room-102"]);
  });

  it("should return null if the rooms are in disconnected sections of the building", () => {
    const disconnectedGraph = buildUndirectedGraph([
      ["A", "B", 1],
      ["C", "D", 1],
    ]);

    const path = findIndoorPath(disconnectedGraph, "A", "D");
    expect(path).toBeNull();
  });

  it("should handle a circular layout and find the most efficient route", () => {
    // A circle: A-B-C-D-A
    const circularGraph = buildUndirectedGraph([
      ["A", "B", 1],
      ["B", "C", 1],
      ["C", "D", 1],
      ["D", "A", 10], // The "long way" around
    ]);

    const path = findIndoorPath(circularGraph, "A", "D");
    // Should go A-B-C-D (weight 3) rather than A-D (weight 10)
    expect(path).toEqual(["A", "B", "C", "D"]);
  });

  it("should return a single-item array when source and destination are identical", () => {
    const path = findIndoorPath(graph, "Lobby", "Lobby");
    expect(path).toEqual(["Lobby"]);
  });

  it("should throw an error if any edge weight is negative", () => {
    const invalidGraph = buildUndirectedGraph([["A", "B", -5]]);

    expect(() => {
      findIndoorPath(invalidGraph, "A", "B");
    }).toThrow("Negative weights are not allowed");
  });

  it("skips inaccessible edges when wheelchair accessibility is enabled", () => {
    const graph = buildUndirectedGraph([
      ["Start", "Shortcut", 1, { accessible: false }],
      ["Shortcut", "End", 1],
      ["Start", "Detour", 2],
      ["Detour", "End", 2],
    ]);

    expect(findIndoorPath(graph, "Start", "End")).toEqual([
      "Start",
      "Shortcut",
      "End",
    ]);
    expect(
      findIndoorPath(graph, "Start", "End", {
        accessibleOnly: true,
      }),
    ).toEqual(["Start", "Detour", "End"]);
  });

  it("avoids escalators and prefers elevator routes when wheelchair accessibility is enabled", () => {
    const graph = buildUndirectedGraph([
      ["Lobby", "Escalator", 1, { type: "escalator" }],
      ["Escalator", "Room", 1],
      ["Lobby", "Elevator", 3],
      ["Elevator", "Room", 1, { type: "elevator" }],
    ]);

    expect(findIndoorPath(graph, "Lobby", "Room")).toEqual([
      "Lobby",
      "Escalator",
      "Room",
    ]);
    expect(
      findIndoorPath(graph, "Lobby", "Room", {
        accessibleOnly: true,
      }),
    ).toEqual(["Lobby", "Elevator", "Room"]);
  });

  it("returns null when wheelchair accessibility is enabled and stairs are the only route", () => {
    const graph = buildUndirectedGraph([
      ["Lobby", "StairLanding", 1, { type: "stair" }],
      ["StairLanding", "Room", 1],
    ]);

    expect(
      findIndoorPath(graph, "Lobby", "Room", {
        accessibleOnly: true,
      }),
    ).toBeNull();
  });
});
