import {
  FloorCheckpointId,
  FloorCheckpointsGraph,
  IndoorNavigationPath,
} from "@/types/mapTypes";
import { PriorityQueue } from "./priorityQueue";

/**
 * implements dijkstra's shortest path algorithm to find the path from a source to a destination
 * @param graph the graph data structure of the entire building
 * @param source the id of the source node
 * @param destination the id of the destination node
 */
export function findIndoorPath(
  graph: FloorCheckpointsGraph,
  source: FloorCheckpointId,
  destination: FloorCheckpointId,
): IndoorNavigationPath | null {
  const queue = new PriorityQueue<Vertex>((a, b) => a.distance < b.distance);
  const shortestDistance: ShortestDistanceInfo = {};

  // Distance from source to itself is always 0
  shortestDistance[source] = {
    distance: 0,
  };
  queue.push({
    distance: 0,
    id: source,
  });

  while (!queue.isEmpty()) {
    const vertex = queue.pop();
    if (vertex.distance > shortestDistance[vertex.id].distance) continue;
    if (vertex.id === destination) {
      break;
    }
    const neighbours = graph.adjacencySet[vertex.id];
    if (!neighbours) continue;

    Object.entries(neighbours).forEach(([neighbourId, edge]) => {
      if (edge.weight < 0) {
        throw new Error("Negative weights are not allowed in shortest path graphs");
      }
      const distanceFromMeToNeighbour =
        shortestDistance[vertex.id].distance + edge.weight;

      // Initialize shortest distance if it hasn't been done yet
      shortestDistance[neighbourId] ??= {
        distance: Infinity,
      };

      // If we found a shortest distance, update it
      if (distanceFromMeToNeighbour < shortestDistance[neighbourId].distance) {
        shortestDistance[neighbourId] = {
          distance: distanceFromMeToNeighbour,
          predecessor: vertex.id,
        };
        queue.push({
          distance: distanceFromMeToNeighbour,
          id: neighbourId,
        });
      }
    });
  }
  return getPathFromDistanceInfo(shortestDistance, destination);
}

type Vertex = {
  distance: number;
  id: FloorCheckpointId;
};

type ShortestDistanceInfo = {
  [key: FloorCheckpointId]: {
    distance: number;
    predecessor?: FloorCheckpointId;
  };
};

function getPathFromDistanceInfo(
  info: ShortestDistanceInfo,
  destination: FloorCheckpointId,
) {
  // Couldn't find the path to the destination
  if (!info[destination] || info[destination].distance === Infinity) {
    return null;
  }
  const result: FloorCheckpointId[] = [];
  let current = destination;
  while (info[current].predecessor !== undefined) {
    result.push(current);
    current = info[current].predecessor!;
  }
  result.push(current);
  return result.reverse();
}
