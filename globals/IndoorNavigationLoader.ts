import {
  BuildingCode,
  BuildingFloorInfo,
  FloorCheckpointsGraph,
  FloorImages,
  RawFloorGraph,
} from "@/types/mapTypes";
import { Asset } from "expo-asset";
import { File } from "expo-file-system";

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
    const jsonTextAsset = await Asset.loadAsync(floorAssetInfo.graphAssetInfo);

    const localUri = jsonTextAsset[0].localUri!; // the local uri is never null since we're loading it manually from asset
    const text = await new File(localUri).text();
    const object = JSON.parse(text);
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
    images: FloorImages;
    graphAssetInfo: number;
  };
};

const CODE_TO_FLOOR_ASSET_INFO: BuildingCodeToFloorData = {
  H: {
    graphAssetInfo: require("@/data/buildings/floors/hall/jsonData/HallFloorPlanV4.json.txt"),
    images: {
      1: require("@/data/buildings/floors/hall/Images/Hall1 (Custom).png"),
      2: require("@/data/buildings/floors/hall/Images/Hall2 (Custom).png"),
      8: require("@/data/buildings/floors/hall/Images/Hall8 (Custom) (2) (Custom) (4).png"),
      9: require("@/data/buildings/floors/hall/Images/Hall9 (Custom).png"),
    },
  },
};

export const NavigationLoader = new IndoorNavigationLoader();
