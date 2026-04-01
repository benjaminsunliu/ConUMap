import { CAMPUS_BUILDINGS } from "@/constants/map";
import { BuildingCode, FloorCheckpointsGraph, RawFloorGraph } from "@/types/mapTypes";
import * as SecureStore from "expo-secure-store";

// REVIEW: please tell me a better name for this
class BuildingNavigationLoader {
  public async clearAllData() {
    const promises = CAMPUS_BUILDINGS.map((building) => {
      return SecureStore.deleteItemAsync(this.getBuildingKey(building.buildingCode));
    });
    await Promise.all(promises);
  }

  public async searchForRoom(searchQuery: string) {
    // TODO:
  }

  public async getBuildingData(buildingCode: BuildingCode) {}

  private static loadData(buildingCode: BuildingCode) {}

  private getBuildingKey(buildingCode: BuildingCode) {
    return `${buildingCode}-rooms-graph`;
  }

  public createGraphFromObject(rawFloorGraph: RawFloorGraph) {
    const floorGraph: FloorCheckpointsGraph = {
      checkpoints: {},
      adjacencySet: {},
    };

    // transfer all the raw data so we can render the information later
    rawFloorGraph.nodes.forEach((node) => {
      floorGraph.checkpoints[node.id] = node;
    });

    // Creating the adjacency set data structure
    rawFloorGraph.edges.forEach((edge) => {
      // Create the set if you haven't already
      if (!floorGraph.adjacencySet[edge.source]) {
        floorGraph.adjacencySet[edge.source] = {};
      }
      // add a new edge from the source to the destination
      const adjacencySet = floorGraph.adjacencySet[edge.source];
      adjacencySet[edge.target] = edge;
    });

    return floorGraph;
  }
}

export const BuildingNavigation = new BuildingNavigationLoader();
