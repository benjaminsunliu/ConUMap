import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { SearchBuilding, TransportationMode } from "@/types/buildingTypes";
import { BuildingInfo, FloorCheckpointsGraph } from "@/types/mapTypes";
import {
  enrichRoutesWithIndoorTransitions,
  resolveSearchSelectionBuildingCode,
} from "@/utils/hybridNavigation";

const routeTemplate = {
  summary: "Test Route",
  overview_polyline: { points: "" },
  totalDurationSeconds: 120,
  legs: [
    {
      distance: { text: "100 m", value: 100 },
      duration: { text: "2 mins", value: 120 },
      steps: [
        {
          distance: { text: "100 m", value: 100 },
          duration: { text: "2 mins", value: 120 },
          html_instructions: "Walk outside",
          maneuver: "",
          polyline: { points: "" },
          travel_mode: "WALKING",
        },
      ],
    },
  ],
};

const mockBuilding: BuildingInfo = {
  buildingCode: "H",
  buildingName: "Henry F. Hall Building",
  location: { latitude: 45.5, longitude: -73.58 },
  polygons: [
    [
      { latitude: 45.51, longitude: -73.59 },
      { latitude: 45.51, longitude: -73.57 },
      { latitude: 45.49, longitude: -73.57 },
      { latitude: 45.49, longitude: -73.59 },
    ],
  ],
  overview: [],
  accessibility: [],
  address: "1455 De Maisonneuve Blvd. W.",
  campus: "SGW",
  url: "",
};

const mockGraph: FloorCheckpointsGraph = {
  checkpoints: {
    H101: {
      id: "H101",
      type: "doorway",
      buildingId: "H",
      floor: 1,
      x: 500,
      y: 500,
      label: "H-101",
      accessible: true,
    },
    H_F1_building_entry_exit_1: {
      id: "H_F1_building_entry_exit_1",
      type: "building_entry_exit",
      buildingId: "H",
      floor: 1,
      x: 0,
      y: 0,
      label: "North Exit",
      accessible: true,
    },
    H_F1_building_entry_exit_2: {
      id: "H_F1_building_entry_exit_2",
      type: "building_entry_exit",
      buildingId: "H",
      floor: 1,
      x: 1000,
      y: 1000,
      label: "South Exit",
      accessible: true,
    },
  },
  adjacencySet: {
    H101: {
      H_F1_building_entry_exit_1: {
        source: "H101",
        target: "H_F1_building_entry_exit_1",
        type: "hallway",
        weight: 5,
        accessible: true,
      },
      H_F1_building_entry_exit_2: {
        source: "H101",
        target: "H_F1_building_entry_exit_2",
        type: "hallway",
        weight: 8,
        accessible: true,
      },
    },
    H_F1_building_entry_exit_1: {
      H101: {
        source: "H_F1_building_entry_exit_1",
        target: "H101",
        type: "hallway",
        weight: 5,
        accessible: true,
      },
    },
    H_F1_building_entry_exit_2: {
      H101: {
        source: "H_F1_building_entry_exit_2",
        target: "H101",
        type: "hallway",
        weight: 8,
        accessible: true,
      },
    },
  },
};

describe("hybridNavigation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resolves parent building code for room search results", () => {
    const roomSelection: SearchBuilding = {
      buildingCode: "H101",
      buildingName: "H101",
      address: "",
      campus: "SGW",
      parentBuildingCode: "H",
      roomName: "H101",
      isIndoorRoom: true,
    };

    const result = resolveSearchSelectionBuildingCode(roomSelection, [mockBuilding]);

    expect(result).toBe("H");
  });

  it("adds indoor transition steps for indoor-to-indoor selections", async () => {
    jest.spyOn(NavigationLoader, "buildingHasNavigationData").mockReturnValue(true);
    jest.spyOn(NavigationLoader, "loadBuildingData").mockResolvedValue({
      buildingCode: "H",
      graphData: mockGraph,
      images: {},
      rooms: ["H101"],
    });

    const routesByMode: Record<TransportationMode, any[] | null> = {
      walking: [{ ...routeTemplate }],
      transit: null,
      driving: null,
      bicycling: null,
      shuttle: null,
    };

    const selections = {
      start: {
        buildingCode: "H101",
        buildingName: "H101",
        address: "",
        campus: "SGW",
        parentBuildingCode: "H",
        roomName: "H101",
        isIndoorRoom: true,
      },
      end: {
        buildingCode: "H101",
        buildingName: "H101",
        address: "",
        campus: "SGW",
        parentBuildingCode: "H",
        roomName: "H101",
        isIndoorRoom: true,
      },
    };

    const result = await enrichRoutesWithIndoorTransitions(routesByMode, selections, [
      mockBuilding,
    ]);

    const steps = result.walking?.[0]?.legs?.[0]?.steps ?? [];

    expect(steps).toHaveLength(3);
    expect(steps[0].travel_mode).toBe("INDOOR");
    expect(steps[0].html_instructions).toContain("North Exit");
    expect(steps[1].travel_mode).toBe("WALKING");
    expect(steps[2].travel_mode).toBe("INDOOR");
    expect(steps[2].html_instructions).toContain("North Exit");
  });

  it("falls back to the next entrance when a higher-priority entrance is not feasible", async () => {
    const graphWithUnreachableNorthExit: FloorCheckpointsGraph = {
      checkpoints: mockGraph.checkpoints,
      adjacencySet: {
        H101: {
          H_F1_building_entry_exit_2: {
            source: "H101",
            target: "H_F1_building_entry_exit_2",
            type: "hallway",
            weight: 8,
            accessible: true,
          },
        },
        H_F1_building_entry_exit_1: {},
        H_F1_building_entry_exit_2: {
          H101: {
            source: "H_F1_building_entry_exit_2",
            target: "H101",
            type: "hallway",
            weight: 8,
            accessible: true,
          },
        },
      },
    };

    jest.spyOn(NavigationLoader, "buildingHasNavigationData").mockReturnValue(true);
    jest.spyOn(NavigationLoader, "loadBuildingData").mockResolvedValue({
      buildingCode: "H",
      graphData: graphWithUnreachableNorthExit,
      images: {},
      rooms: ["H101"],
    });

    const result = await enrichRoutesWithIndoorTransitions(
      {
        walking: [{ ...routeTemplate }],
        transit: null,
        driving: null,
        bicycling: null,
        shuttle: null,
      },
      {
        start: {
          buildingCode: "H101",
          buildingName: "H101",
          address: "",
          campus: "SGW",
          parentBuildingCode: "H",
          roomName: "H101",
          isIndoorRoom: true,
        },
        end: {
          buildingCode: "H101",
          buildingName: "H101",
          address: "",
          campus: "SGW",
          parentBuildingCode: "H",
          roomName: "H101",
          isIndoorRoom: true,
        },
      },
      [mockBuilding],
    );

    const steps = result.walking?.[0]?.legs?.[0]?.steps ?? [];
    expect(steps[0].html_instructions).toContain("South Exit");
    expect(steps[2].html_instructions).toContain("South Exit");
  });

  it("chooses the shortest feasible entrance path for outdoor-to-indoor transitions", async () => {
    const graphWithShortestPathChoice: FloorCheckpointsGraph = {
      checkpoints: {
        H301: {
          id: "H301",
          type: "doorway",
          buildingId: "H",
          floor: 3,
          x: 500,
          y: 500,
          label: "H-301",
          accessible: true,
        },
        H_F1_building_entry_exit_1: {
          id: "H_F1_building_entry_exit_1",
          type: "building_entry_exit",
          buildingId: "H",
          floor: 3,
          x: 100,
          y: 100,
          label: "Long Same-Floor Entrance",
          accessible: true,
        },
        H_F1_building_entry_exit_2: {
          id: "H_F1_building_entry_exit_2",
          type: "building_entry_exit",
          buildingId: "H",
          floor: 1,
          x: 900,
          y: 900,
          label: "Short Lower-Floor Entrance",
          accessible: true,
        },
        H_F2_hallway_mid: {
          id: "H_F2_hallway_mid",
          type: "hallway",
          buildingId: "H",
          floor: 2,
          x: 700,
          y: 700,
          label: "Mid Hallway",
          accessible: true,
        },
      },
      adjacencySet: {
        H301: {
          H_F1_building_entry_exit_1: {
            source: "H301",
            target: "H_F1_building_entry_exit_1",
            type: "hallway",
            weight: 10,
            accessible: true,
          },
          H_F2_hallway_mid: {
            source: "H301",
            target: "H_F2_hallway_mid",
            type: "hallway",
            weight: 1,
            accessible: true,
          },
        },
        H_F1_building_entry_exit_1: {
          H301: {
            source: "H_F1_building_entry_exit_1",
            target: "H301",
            type: "hallway",
            weight: 10,
            accessible: true,
          },
        },
        H_F1_building_entry_exit_2: {
          H_F2_hallway_mid: {
            source: "H_F1_building_entry_exit_2",
            target: "H_F2_hallway_mid",
            type: "stairs",
            weight: 1,
            accessible: true,
          },
        },
        H_F2_hallway_mid: {
          H301: {
            source: "H_F2_hallway_mid",
            target: "H301",
            type: "stairs",
            weight: 1,
            accessible: true,
          },
          H_F1_building_entry_exit_2: {
            source: "H_F2_hallway_mid",
            target: "H_F1_building_entry_exit_2",
            type: "stairs",
            weight: 1,
            accessible: true,
          },
        },
      },
    };

    jest.spyOn(NavigationLoader, "buildingHasNavigationData").mockReturnValue(true);
    jest.spyOn(NavigationLoader, "loadBuildingData").mockResolvedValue({
      buildingCode: "H",
      graphData: graphWithShortestPathChoice,
      images: {},
      rooms: ["H301"],
    });

    const result = await enrichRoutesWithIndoorTransitions(
      {
        walking: [{ ...routeTemplate }],
        transit: null,
        driving: null,
        bicycling: null,
        shuttle: null,
      },
      {
        start: null,
        end: {
          buildingCode: "H301",
          buildingName: "H301",
          address: "",
          campus: "SGW",
          parentBuildingCode: "H",
          roomName: "H301",
          isIndoorRoom: true,
        },
      },
      [mockBuilding],
    );

    const steps = result.walking?.[0]?.legs?.[0]?.steps ?? [];
    expect(steps).toHaveLength(2);
    expect(steps[1].travel_mode).toBe("INDOOR");
    expect(steps[1].html_instructions).toContain("Short Lower-Floor Entrance");
  });

  it("chooses the shortest feasible entrance path for indoor-to-outdoor transitions", async () => {
    const graphWithShortestPathChoice: FloorCheckpointsGraph = {
      checkpoints: {
        H301: {
          id: "H301",
          type: "doorway",
          buildingId: "H",
          floor: 3,
          x: 500,
          y: 500,
          label: "H-301",
          accessible: true,
        },
        H_F1_building_entry_exit_1: {
          id: "H_F1_building_entry_exit_1",
          type: "building_entry_exit",
          buildingId: "H",
          floor: 3,
          x: 100,
          y: 100,
          label: "Long Same-Floor Entrance",
          accessible: true,
        },
        H_F1_building_entry_exit_2: {
          id: "H_F1_building_entry_exit_2",
          type: "building_entry_exit",
          buildingId: "H",
          floor: 1,
          x: 900,
          y: 900,
          label: "Short Lower-Floor Entrance",
          accessible: true,
        },
        H_F2_hallway_mid: {
          id: "H_F2_hallway_mid",
          type: "hallway",
          buildingId: "H",
          floor: 2,
          x: 700,
          y: 700,
          label: "Mid Hallway",
          accessible: true,
        },
      },
      adjacencySet: {
        H301: {
          H_F1_building_entry_exit_1: {
            source: "H301",
            target: "H_F1_building_entry_exit_1",
            type: "hallway",
            weight: 10,
            accessible: true,
          },
          H_F2_hallway_mid: {
            source: "H301",
            target: "H_F2_hallway_mid",
            type: "hallway",
            weight: 1,
            accessible: true,
          },
        },
        H_F1_building_entry_exit_1: {
          H301: {
            source: "H_F1_building_entry_exit_1",
            target: "H301",
            type: "hallway",
            weight: 10,
            accessible: true,
          },
        },
        H_F1_building_entry_exit_2: {
          H_F2_hallway_mid: {
            source: "H_F1_building_entry_exit_2",
            target: "H_F2_hallway_mid",
            type: "stairs",
            weight: 1,
            accessible: true,
          },
        },
        H_F2_hallway_mid: {
          H301: {
            source: "H_F2_hallway_mid",
            target: "H301",
            type: "stairs",
            weight: 1,
            accessible: true,
          },
          H_F1_building_entry_exit_2: {
            source: "H_F2_hallway_mid",
            target: "H_F1_building_entry_exit_2",
            type: "stairs",
            weight: 1,
            accessible: true,
          },
        },
      },
    };

    jest.spyOn(NavigationLoader, "buildingHasNavigationData").mockReturnValue(true);
    jest.spyOn(NavigationLoader, "loadBuildingData").mockResolvedValue({
      buildingCode: "H",
      graphData: graphWithShortestPathChoice,
      images: {},
      rooms: ["H301"],
    });

    const result = await enrichRoutesWithIndoorTransitions(
      {
        walking: [{ ...routeTemplate }],
        transit: null,
        driving: null,
        bicycling: null,
        shuttle: null,
      },
      {
        start: {
          buildingCode: "H301",
          buildingName: "H301",
          address: "",
          campus: "SGW",
          parentBuildingCode: "H",
          roomName: "H301",
          isIndoorRoom: true,
        },
        end: null,
      },
      [mockBuilding],
    );

    const steps = result.walking?.[0]?.legs?.[0]?.steps ?? [];
    expect(steps).toHaveLength(2);
    expect(steps[0].travel_mode).toBe("INDOOR");
    expect(steps[0].html_instructions).toContain("Short Lower-Floor Entrance");
  });

  it("returns original routes when there are no room selections", async () => {
    const routesByMode: Record<TransportationMode, any[] | null> = {
      walking: [{ ...routeTemplate }],
      transit: null,
      driving: null,
      bicycling: null,
      shuttle: null,
    };

    const result = await enrichRoutesWithIndoorTransitions(
      routesByMode,
      { start: null, end: null },
      [mockBuilding],
    );

    expect(result).toBe(routesByMode);
  });

  it("treats non-array route buckets as unavailable instead of crashing", async () => {
    jest.spyOn(NavigationLoader, "buildingHasNavigationData").mockReturnValue(true);
    jest.spyOn(NavigationLoader, "loadBuildingData").mockResolvedValue({
      buildingCode: "H",
      graphData: mockGraph,
      images: {},
      rooms: ["H101"],
    });

    const result = await enrichRoutesWithIndoorTransitions(
      {
        walking: undefined as unknown as any[],
        transit: [{ ...routeTemplate }],
        driving: null,
        bicycling: null,
        shuttle: null,
      } as unknown as Record<TransportationMode, any[] | null>,
      {
        start: null,
        end: {
          buildingCode: "H101",
          buildingName: "H101",
          address: "",
          campus: "SGW",
          parentBuildingCode: "H",
          roomName: "H101",
          isIndoorRoom: true,
        },
      },
      [mockBuilding],
    );

    expect(result.walking).toBeNull();
    expect(result.transit?.[0]?.legs?.[0]?.steps?.at(-1)?.travel_mode).toBe("INDOOR");
  });
});
