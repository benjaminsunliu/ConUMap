import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { RawFloorGraph } from "@/types/mapTypes";

describe("IndoorNavigationLoader", () => {
  it("Should be able to load a building", async () => {
    const navigationData = await NavigationLoader.loadBuildingData("H");
    expect(navigationData).not.toBeNull();
    expect(navigationData!.buildingCode).toBe("H");
    const graphCheckpoints = Object.keys(navigationData!.graphData.checkpoints);
    const adjacencySets = Object.keys(navigationData!.graphData.adjacencySet);
    expect(graphCheckpoints.length).toBeGreaterThan(0);
    expect(adjacencySets.length).toBeGreaterThan(0);
  });

  it("Should return null when trying to find a building that doesn't exist", async () => {
    const data = await NavigationLoader.loadBuildingData("asdf");
    expect(data).toBeNull();
  });

  it("Should get a chache hit when there is a building already loaded", async () => {
    const originalData = await NavigationLoader.loadBuildingData("H");
    const cachedData = await NavigationLoader.loadBuildingData("H");

    // since it should be loading the object from cache, it should
    // be the exact same object
    expect(originalData).toBe(cachedData);
  });

  it("Should clear the cache when the method clearCache is called", async () => {
    const originalData = await NavigationLoader.loadBuildingData("H");

    NavigationLoader.clearCache();

    const recalledData = await NavigationLoader.loadBuildingData("H");

    // since the building is not the one from cache, it should be a different object
    expect(originalData).not.toBe(recalledData);
  });

  it("Should not hold any references to the cached data when the cache is cleared", async () => {
    // setup
    NavigationLoader.clearCache();
    let ref: WeakRef<any>;

    // load the building and keep a reference that doesn't count towards garbage collection
    await (async () => {
      let data = await NavigationLoader.loadBuildingData("H");
      ref = new WeakRef(data!);
      data = null as any;
    })();

    // ACT
    NavigationLoader.clearCache();
    await forceGC();

    // the building should have been cleared from memory
    expect(ref!.deref()).toBeUndefined();
  });

  it("Should not cache things when the cache size is 0", async () => {
    NavigationLoader.resizeCache(0);

    const originalData = await NavigationLoader.loadBuildingData("H");
    const recalledData = await NavigationLoader.loadBuildingData("H");

    expect(originalData).not.toBe(recalledData);
    expect(NavigationLoader.clearCache()).toHaveLength(0);
  });

  it("should clear items from the cache when it hits the max number", async () => {
    NavigationLoader.resizeCache(1);

    await NavigationLoader.loadBuildingData("H");
    await NavigationLoader.loadBuildingData("VL");

    expect(NavigationLoader.clearCache()).toHaveLength(1);
  });

  it("buildingHasNavigationData should return false if the building doesn't exist", () => {
    const result = NavigationLoader.buildingHasNavigationData("asdf");
    expect(result).toBe(false);
  });
});

const fakeBuildingData: RawFloorGraph = {
  meta: {
    buildingId: "H",
  },
  nodes: [
    {
      accessible: false,
      floor: 1,
      buildingId: "H",
      id: "CHECKPOINT1",
      type: "",
      x: 2,
      y: 1,
    },
    {
      accessible: false,
      floor: 1,
      buildingId: "H",
      id: "CHECKPOINT2",
      type: "",
      x: 2,
      y: 1,
    },
  ],
  edges: [
    {
      accessible: false,
      source: "CHECKPOINT1",
      target: "CHECKPOINT2",
      type: "",
      weight: 222,
    },
  ],
};

jest.mock("expo-file-system", () => ({
  File: class MockedFile {
    constructor(path: string) {}

    public text() {
      return new Promise((r) => {
        r(JSON.stringify(fakeBuildingData));
      });
    }
  },
}));

const forceGC = async () => {
  if (globalThis.gc) {
    globalThis.gc();
    globalThis.gc();
    globalThis.gc();
    // Wait for the event loop to fully cycle multiple times
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      globalThis.gc();
    }
  }
};
