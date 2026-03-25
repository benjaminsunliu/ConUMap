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
  const shortestDistance = runDijkstra(graph, source, destination);
  return getPathFromDistanceInfo(shortestDistance, destination);
}

/* 
 * finds the nearest entry/exit point from a given source checkpoint, 
 * and returns the path to it 
*/
export function findNearestEntryExitPath(
  graph: FloorCheckpointsGraph,
  source: FloorCheckpointId,
): IndoorNavigationPath | null {
  const shortestDistance = runDijkstra(graph, source);

  let nearestEntryExitId: FloorCheckpointId | undefined;
  let minDistance = Infinity;

  Object.values(graph.checkpoints).forEach((checkpoint) => {
    if (checkpoint.type !== "building_entry_exit") {
      return;
    }
    // if this entry/exit is unreachable from the source, skip it
    const distance = shortestDistance[checkpoint.id]?.distance ?? Infinity;
    if(distance === Infinity) {
      return;
    }
    // if this entry/exit is closer than the previously found ones, update nearest entry/exit
    if(distance < minDistance) {
      minDistance = distance;
      nearestEntryExitId = checkpoint.id;
    }
  });

  // if there is no path to any entry/exit, return null
  if (!nearestEntryExitId) {
    return null;
  }
  // return the path to the nearest entry/exit
  return getPathFromDistanceInfo(shortestDistance, nearestEntryExitId);
}


function runDijkstra(
  graph: FloorCheckpointsGraph,
  source: FloorCheckpointId,
  destination?: FloorCheckpointId,
): ShortestDistanceInfo {
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
    if (destination && vertex.id === destination) {
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
  return shortestDistance;
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
): FloorCheckpointId[] | null {
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
