import {
  BuildingCode,
  BuildingFloorInfo,
  FloorCheckpointsGraph,
  RawFloorGraph,
} from "@/types/mapTypes";
import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { ImageRequireSource } from "react-native";

class IndoorNavigationLoader {
  private loadedBuildings: BuildingFloorInfo[] = [];
  private maxLoadedBuildings: number;

  constructor(maxLoadedBuildings: number = 5) {
    this.maxLoadedBuildings = maxLoadedBuildings;
  }

  public async loadBuildingData(buildingCode: BuildingCode) {
    const cacheHit = this.loadFromCache(buildingCode);
    if (cacheHit) {
      return cacheHit;
    }
    const floorInfo = await this.loadData(buildingCode);
    if (!floorInfo) {
      return null;
    }
    this.saveToCache(floorInfo);
    return floorInfo;
  }

  public buildingHasNavigationData(buildingCode: BuildingCode) {
    return CODE_TO_FLOOR_ASSET_INFO[buildingCode] !== undefined;
  }

  /**
   * Clears that cache of loaded buildings
   * @returns the buildings that were loaded in the cache
   */
  public clearCache() {
    return this.loadedBuildings.splice(0, this.loadedBuildings.length);
  }

  /**
   * resizes the cache to be of a certain number of buildings
   * @param maxBuildings the new size of the cache
   * @returns the buildings that could no longer fit in the cache, if any
   */
  public resizeCache(maxBuildings: number) {
    if (maxBuildings < this.maxLoadedBuildings) {
      this.loadedBuildings.splice(0, maxBuildings);
    }
    this.maxLoadedBuildings = maxBuildings;
    return this.loadedBuildings.splice(0, this.maxLoadedBuildings);
  }

  private async loadData(buildingCode: BuildingCode) {
    if (!CODE_TO_FLOOR_ASSET_INFO[buildingCode]) {
      return null;
    }

    const floorAssetInfo = CODE_TO_FLOOR_ASSET_INFO[buildingCode];
    const json = await this.loadTextFromFile(floorAssetInfo.graphAssetInfo);
    const object = JSON.parse(json);
    const graph = this.createGraphFromRawGraph(object);
    const buildingFloorInfo: BuildingFloorInfo = {
      images: floorAssetInfo.images,
      graphData: graph,
      buildingCode,
    };
    return buildingFloorInfo;
  }

  private createGraphFromRawGraph(rawFloorGraph: RawFloorGraph) {
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
      // Create the set
      if (!floorGraph.adjacencySet[edge.source]) {
        floorGraph.adjacencySet[edge.source] = {};
      }
      if (!floorGraph.adjacencySet[edge.target]) {
        floorGraph.adjacencySet[edge.target] = {};
      }

      // add a new edge from the source to the destination, and destination to source
      floorGraph.adjacencySet[edge.source][edge.target] = edge;

      // since it is an undirected graph, we should invert the edge to get it to go both ways
      floorGraph.adjacencySet[edge.target][edge.source] = {
        ...edge,
        source: edge.target,
        target: edge.source,
      };
    });

    return floorGraph;
  }

  private async loadTextFromFile(moduleNumber: number) {
    const asset = await Asset.loadAsync(moduleNumber);
    return await new File(asset[0].localUri!).text();
  }

  private saveToCache(floorInfo: BuildingFloorInfo) {
    if (this.maxLoadedBuildings <= 0) {
      return;
    }
    if (this.loadedBuildings.length >= this.maxLoadedBuildings) {
      this.loadedBuildings.shift();
    }
    this.loadedBuildings.push(floorInfo);
  }

  private loadFromCache(buildingCode: BuildingCode) {
    const cacheHit = this.loadedBuildings.find(
      (info) => info.buildingCode === buildingCode,
    );
    return cacheHit || null;
  }
}

type BuildingCodeToFloorData = {
  [key: BuildingCode]: {
    images: {
      [key: number]: ImageRequireSource;
    };
    graphAssetInfo: number;
  };
};

export const CODE_TO_FLOOR_ASSET_INFO: BuildingCodeToFloorData = {
  CC: {
    graphAssetInfo: require("@/data/indoorMapData/jsonGraphs/CC_floor_plan.json.txt"),
    images: {
      1: require("@/data/indoorMapData/images/CC/CC.png"),
    },
  },
  H: {
    graphAssetInfo: require("@/data/indoorMapData/jsonGraphs/H_floor_plan.json.txt"),
    images: {
      1: require("@/data/indoorMapData/images/H/H1.png"),
      2: require("@/data/indoorMapData/images/H/H2.png"),
      8: require("@/data/indoorMapData/images/H/H8.png"),
      9: require("@/data/indoorMapData/images/H/H9.png"),
    },
  },
  LB: {
    graphAssetInfo: require("@/data/indoorMapData/jsonGraphs/LB_floor_plan.json.txt"),
    images: {
      2: require("@/data/indoorMapData/images/LB/LB2.png"),
      3: require("@/data/indoorMapData/images/LB/LB3.png"),
      4: require("@/data/indoorMapData/images/LB/LB4.png"),
      5: require("@/data/indoorMapData/images/LB/LB5.png"),
    },
  },
  MB: {
    graphAssetInfo: require("@/data/indoorMapData/jsonGraphs/MB_floor_plan.json.txt"),
    images: {
      1: require("@/data/indoorMapData/images/MB/MB1.png"),
      "-2": require("@/data/indoorMapData/images/MB/MB-2.png"),
    },
  },
  VE: {
    graphAssetInfo: require("@/data/indoorMapData/jsonGraphs/VE_floor_plan.json.txt"),
    images: {
      1: require("@/data/indoorMapData/images/VE/VE1.png"),
      2: require("@/data/indoorMapData/images/VE/VE2.png"),
    },
  },
  VL: {
    graphAssetInfo: require("@/data/indoorMapData/jsonGraphs/VL_floor_plan.json.txt"),
    images: {
      1: require("@/data/indoorMapData/images/VL/VL1.png"),
      2: require("@/data/indoorMapData/images/VL/VL2.png"),
    },
  },
};

export const NavigationLoader = new IndoorNavigationLoader();
