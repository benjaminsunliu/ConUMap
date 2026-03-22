import { findPathFromRoomToRoom } from "@/utils/indoorNavigation"; // Adjust path accordingly
import {
  FloorCheckpointAdjancencySet,
  FloorCheckpointConnection,
  FloorCheckpointsGraph,
} from "@/types/mapTypes";

describe("findPathFromRoomToRoom (Undirected Graph)", () => {
  const buildUndirectedGraph = (
    edges: [string, string, number][],
  ): FloorCheckpointsGraph => {
    const adjacencySet: FloorCheckpointAdjancencySet = {};
    const defaultEdge: FloorCheckpointConnection = {
      accessible: true,
      source: "",
      target: "",
      type: "",
      weight: Infinity,
    };

    edges.forEach(([u, v, weight]) => {
      if (!adjacencySet[u]) adjacencySet[u] = {};
      if (!adjacencySet[v]) adjacencySet[v] = {};
      adjacencySet[u][v] = { ...defaultEdge, weight };
      adjacencySet[v][u] = { ...defaultEdge, weight };
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
    const forward = findPathFromRoomToRoom(graph, "Lobby", "Room-101");
    const backward = findPathFromRoomToRoom(graph, "Room-101", "Lobby");

    expect(forward).toEqual(["Lobby", "Elevator", "Hallway-1", "Room-101"]);
    expect(backward).toEqual(["Room-101", "Hallway-1", "Elevator", "Lobby"]);
  });

  it("should prioritize the shorter weighted path, even if it has more steps", () => {
    // Direct Lobby -> Room-102 is weight 10.
    // Lobby -> Elevator -> Hallway-1 -> Room-102 is weight (2+1+5) = 8.
    const path = findPathFromRoomToRoom(graph, "Lobby", "Room-102");

    expect(path).toEqual(["Lobby", "Elevator", "Hallway-1", "Room-102"]);
  });

  it("should return null if the rooms are in disconnected sections of the building", () => {
    const disconnectedGraph = buildUndirectedGraph([
      ["A", "B", 1],
      ["C", "D", 1],
    ]);

    const path = findPathFromRoomToRoom(disconnectedGraph, "A", "D");
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

    const path = findPathFromRoomToRoom(circularGraph, "A", "D");
    // Should go A-B-C-D (weight 3) rather than A-D (weight 10)
    expect(path).toEqual(["A", "B", "C", "D"]);
  });

  it("should return a single-item array when source and destination are identical", () => {
    const path = findPathFromRoomToRoom(graph, "Lobby", "Lobby");
    expect(path).toEqual(["Lobby"]);
  });

  it("should throw an error if any edge weight is negative", () => {
    const invalidGraph = buildUndirectedGraph([["A", "B", -5]]);

    expect(() => {
      findPathFromRoomToRoom(invalidGraph, "A", "B");
    }).toThrow("Negative weights are not allowed");
  });
});
