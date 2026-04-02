import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import IndoorMap from "@/app/(tabs)/(map)/[buildingCode]";
import { OutdoorStepResume } from "@/globals/OutdoorStepResumeStore";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

const mockBuildingFloor = jest.fn((_: any) => null);
const mockIndoorRoomFields = jest.fn((_: any) => null);
const mockIndoorNavigationControls = jest.fn((_: any) => null);

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    back: jest.fn(),
  },
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/components/map/building-floor", () => (props: unknown) => {
  mockBuildingFloor(props);
  return null;
});

jest.mock("@/components/map/indoor-room-fields", () => (props: unknown) => {
  mockIndoorRoomFields(props);
  return null;
});

jest.mock("@/components/map/indoor-map-settings", () => () => null);
jest.mock("@/components/map/indoor-navigation-controls", () => (props: unknown) => {
  mockIndoorNavigationControls(props);
  return null;
});

describe("IndoorMap step-driven navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    OutdoorStepResume.reset();
  });

  it("builds an indoor path from entry checkpoint to destination room from URL params", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
      indoorStartCheckpointId: "H_F2_building_entry_exit_15",
      indoorEndRoom: "H110",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1, 2: 2 },
        graphData: {
          checkpoints: {
            H_F2_building_entry_exit_15: {
              id: "H_F2_building_entry_exit_15",
              type: "building_entry_exit",
              buildingId: "H",
              floor: 2,
              x: 100,
              y: 100,
              label: "H2 Entry Exit 3",
              accessible: true,
            },
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 2,
              x: 200,
              y: 100,
              label: "H-110",
              accessible: true,
            },
          },
          adjacencySet: {
            H_F2_building_entry_exit_15: {
              H110: {
                source: "H_F2_building_entry_exit_15",
                target: "H110",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
            H110: {
              H_F2_building_entry_exit_15: {
                source: "H110",
                target: "H_F2_building_entry_exit_15",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
          },
        },
        buildingCode: "H",
        rooms: ["H110"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    await waitFor(() => {
      const roomFieldsProps = mockIndoorRoomFields.mock.calls.at(-1)?.[0] as any;
      expect(roomFieldsProps.startRoom).toBe("H2 Entry Exit 3");
      expect(roomFieldsProps.endRoom).toBe("H110");
      expect(roomFieldsProps.roomSuggestions).toEqual(
        expect.arrayContaining([
          "H110",
          "H2 Entry Exit 3",
          "H_F2_building_entry_exit_15",
        ]),
      );

      const floorProps = mockBuildingFloor.mock.calls.at(-1)?.[0] as any;
      expect(floorProps.floor).toBe(2);
      expect(floorProps.navigationPath).toEqual(["H_F2_building_entry_exit_15", "H110"]);
      expect(floorProps.isStepMode).toBe(true);
      expect(floorProps.activeStepIndex).toBe(0);

      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      expect(controlsProps.mode).toBe("step");
      expect(controlsProps.currentStep).toBe(1);
      expect(controlsProps.totalSteps).toBe(2);
      expect(controlsProps.canGoPrevious).toBe(false);
      expect(controlsProps.canGoNext).toBe(true);
      expect(controlsProps.stepInstruction).toContain("Start");
    });
  });

  it("builds an indoor path from room to entry checkpoint from URL params", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
      indoorStartRoom: "H110",
      indoorEndCheckpointId: "H_F2_building_entry_exit_15",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1, 2: 2 },
        graphData: {
          checkpoints: {
            H_F2_building_entry_exit_15: {
              id: "H_F2_building_entry_exit_15",
              type: "building_entry_exit",
              buildingId: "H",
              floor: 2,
              x: 100,
              y: 100,
              label: "H2 Entry Exit 3",
              accessible: true,
            },
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 2,
              x: 200,
              y: 100,
              label: "H-110",
              accessible: true,
            },
          },
          adjacencySet: {
            H_F2_building_entry_exit_15: {
              H110: {
                source: "H_F2_building_entry_exit_15",
                target: "H110",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
            H110: {
              H_F2_building_entry_exit_15: {
                source: "H110",
                target: "H_F2_building_entry_exit_15",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
          },
        },
        buildingCode: "H",
        rooms: ["H110"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    await waitFor(() => {
      const roomFieldsProps = mockIndoorRoomFields.mock.calls.at(-1)?.[0] as any;
      expect(roomFieldsProps.startRoom).toBe("H110");
      expect(roomFieldsProps.endRoom).toBe("H2 Entry Exit 3");

      const floorProps = mockBuildingFloor.mock.calls.at(-1)?.[0] as any;
      expect(floorProps.floor).toBe(2);
      expect(floorProps.navigationPath).toEqual(["H110", "H_F2_building_entry_exit_15"]);
    });
  });

  it("builds an indoor path from room to room from URL params", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
      indoorStartRoom: "H110",
      indoorEndRoom: "H111",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1, 2: 2 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 2,
              x: 200,
              y: 100,
              label: "H-110",
              accessible: true,
            },
            H111: {
              id: "H111",
              type: "doorway",
              buildingId: "H",
              floor: 2,
              x: 240,
              y: 100,
              label: "H-111",
              accessible: true,
            },
          },
          adjacencySet: {
            H110: {
              H111: {
                source: "H110",
                target: "H111",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
            H111: {
              H110: {
                source: "H111",
                target: "H110",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
          },
        },
        buildingCode: "H",
        rooms: ["H110", "H111"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    await waitFor(() => {
      const roomFieldsProps = mockIndoorRoomFields.mock.calls.at(-1)?.[0] as any;
      expect(roomFieldsProps.startRoom).toBe("H110");
      expect(roomFieldsProps.endRoom).toBe("H111");

      const floorProps = mockBuildingFloor.mock.calls.at(-1)?.[0] as any;
      expect(floorProps.floor).toBe(2);
      expect(floorProps.navigationPath).toEqual(["H110", "H111"]);
    });
  });

  it("skips intermediate vertical checkpoints and jumps to the connector destination floor", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
      indoorStartRoom: "H110",
      indoorEndRoom: "H310",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1, 2: 2, 3: 3 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 50,
              y: 50,
              label: "H-110",
              accessible: true,
            },
            H_F1_stair_landing_1: {
              id: "H_F1_stair_landing_1",
              type: "stair_landing",
              buildingId: "H",
              floor: 1,
              x: 100,
              y: 50,
              accessible: true,
            },
            H_F2_stair_landing_1: {
              id: "H_F2_stair_landing_1",
              type: "stair_landing",
              buildingId: "H",
              floor: 2,
              x: 100,
              y: 50,
              accessible: true,
            },
            H_F3_stair_landing_1: {
              id: "H_F3_stair_landing_1",
              type: "stair_landing",
              buildingId: "H",
              floor: 3,
              x: 100,
              y: 50,
              accessible: true,
            },
            H310: {
              id: "H310",
              type: "doorway",
              buildingId: "H",
              floor: 3,
              x: 150,
              y: 50,
              label: "H-310",
              accessible: true,
            },
          },
          adjacencySet: {
            H110: {
              H_F1_stair_landing_1: {
                source: "H110",
                target: "H_F1_stair_landing_1",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
            H_F1_stair_landing_1: {
              H110: {
                source: "H_F1_stair_landing_1",
                target: "H110",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
              H_F2_stair_landing_1: {
                source: "H_F1_stair_landing_1",
                target: "H_F2_stair_landing_1",
                type: "stair",
                weight: 1,
                accessible: true,
              },
            },
            H_F2_stair_landing_1: {
              H_F1_stair_landing_1: {
                source: "H_F2_stair_landing_1",
                target: "H_F1_stair_landing_1",
                type: "stair",
                weight: 1,
                accessible: true,
              },
              H_F3_stair_landing_1: {
                source: "H_F2_stair_landing_1",
                target: "H_F3_stair_landing_1",
                type: "stair",
                weight: 1,
                accessible: true,
              },
            },
            H_F3_stair_landing_1: {
              H_F2_stair_landing_1: {
                source: "H_F3_stair_landing_1",
                target: "H_F2_stair_landing_1",
                type: "stair",
                weight: 1,
                accessible: true,
              },
              H310: {
                source: "H_F3_stair_landing_1",
                target: "H310",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
            H310: {
              H_F3_stair_landing_1: {
                source: "H310",
                target: "H_F3_stair_landing_1",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
          },
        },
        buildingCode: "H",
        rooms: ["H110", "H310"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    await waitFor(() => {
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      expect(controlsProps.currentStep).toBe(1);
      expect(controlsProps.totalSteps).toBe(4);
    });

    await act(async () => {
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      controlsProps.onNext();
    });

    await waitFor(() => {
      const floorProps = mockBuildingFloor.mock.calls.at(-1)?.[0] as any;
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      expect(floorProps.floor).toBe(1);
      expect(floorProps.activeStepIndex).toBe(1);
      expect(controlsProps.stepInstruction).toContain("Floor 3");
    });

    await act(async () => {
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      controlsProps.onNext();
    });

    await waitFor(() => {
      const floorProps = mockBuildingFloor.mock.calls.at(-1)?.[0] as any;
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      expect(floorProps.floor).toBe(3);
      expect(floorProps.activeStepIndex).toBe(3);
      expect(controlsProps.currentStep).toBe(3);
    });
  });

  it("continues to the saved outdoor step after the final indoor step", async () => {
    OutdoorStepResume.saveContinuation({
      encodedPolyline: "outdoor-step-polyline",
      travelMode: "WALK",
    });

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
      indoorStartRoom: "H110",
      indoorEndCheckpointId: "H_F2_building_entry_exit_15",
      resumeContinuationId: "outdoor-step-0",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 2: 2 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 2,
              x: 200,
              y: 100,
              label: "H-110",
              accessible: true,
            },
            H_F2_building_entry_exit_15: {
              id: "H_F2_building_entry_exit_15",
              type: "building_entry_exit",
              buildingId: "H",
              floor: 2,
              x: 260,
              y: 100,
              label: "H2 Entry Exit 3",
              accessible: true,
            },
          },
          adjacencySet: {
            H110: {
              H_F2_building_entry_exit_15: {
                source: "H110",
                target: "H_F2_building_entry_exit_15",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
            H_F2_building_entry_exit_15: {
              H110: {
                source: "H_F2_building_entry_exit_15",
                target: "H110",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
          },
        },
        buildingCode: "H",
        rooms: ["H110"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    await waitFor(() => {
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      expect(controlsProps.canGoNext).toBe(true);
    });

    await act(async () => {
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      controlsProps.onNext();
    });

    await waitFor(() => {
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      expect(controlsProps.currentStep).toBe(2);
      expect(controlsProps.canGoNext).toBe(true);
      expect(controlsProps.stepInstruction).toContain(
        "Continue to the outdoor route on the next step.",
      );
    });

    await act(async () => {
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      controlsProps.onNext();
    });

    expect(router.back).toHaveBeenCalled();
    expect(OutdoorStepResume.consumePendingStep()).toEqual({
      encodedPolyline: "outdoor-step-polyline",
      travelMode: "WALK",
    });
  });
});
