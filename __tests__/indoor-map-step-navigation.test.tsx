import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import IndoorMap from "@/app/(tabs)/(map)/[buildingCode]";
import { IndoorMapSettings } from "@/globals/IndoorMapSettingsStore";
import { OutdoorStepResume } from "@/globals/OutdoorStepResumeStore";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";

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

jest.mock("expo-secure-store", () => {
  const storage = new Map<string, string>();
  return {
    deleteItemAsync: jest.fn(async (key: string) => {
      storage.delete(key);
    }),
    getItemAsync: jest.fn(async (key: string) => storage.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    __reset: () => storage.clear(),
  };
});

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

const getLatestFloorProps = () => mockBuildingFloor.mock.calls.at(-1)?.[0] as any;
const getLatestRoomFieldsProps = () => mockIndoorRoomFields.mock.calls.at(-1)?.[0] as any;
const getLatestControlProps = () =>
  mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;

describe("IndoorMap step-driven navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    IndoorMapSettings.reset();
    (SecureStore as any).__reset();
    OutdoorStepResume.reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    await act(async () => {
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      controlsProps.onPrevious();
    });

    await waitFor(() => {
      const floorProps = mockBuildingFloor.mock.calls.at(-1)?.[0] as any;
      const controlsProps = mockIndoorNavigationControls.mock.calls.at(-1)?.[0] as any;
      expect(floorProps.floor).toBe(1);
      expect(controlsProps.currentStep).toBe(2);
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

  it("updates location validation errors as typed room values change", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 100,
              y: 100,
              label: "H-110",
              accessible: true,
            },
            H111: {
              id: "H111",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 200,
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

    await act(async () => {
      const roomFieldsProps = getLatestRoomFieldsProps();
      roomFieldsProps.onChangeStartRoom("Mystery");
      roomFieldsProps.onChangeEndRoom("Unknown");
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().routeError).toBe(
        'Start location "Mystery" and end location "Unknown" were not found.',
      );
    });

    await act(async () => {
      getLatestRoomFieldsProps().onChangeStartRoom("H110");
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().routeError).toBe(
        'End location "Unknown" was not found.',
      );
    });

    await act(async () => {
      const roomFieldsProps = getLatestRoomFieldsProps();
      roomFieldsProps.onChangeStartRoom("Mystery");
      roomFieldsProps.onChangeEndRoom("H111");
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().routeError).toBe(
        'Start location "Mystery" was not found.',
      );
    });
  });

  it("creates a manual room path from normalized location aliases and clears it when inputs become incomplete", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 100,
              y: 100,
              label: "H-110",
              accessible: true,
            },
            H111: {
              id: "H111",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 200,
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

    await act(async () => {
      const roomFieldsProps = getLatestRoomFieldsProps();
      roomFieldsProps.onChangeStartRoom("110");
      roomFieldsProps.onChangeEndRoom("111");
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().canCreatePath).toBe(true);
    });

    await act(async () => {
      getLatestRoomFieldsProps().onCreatePath();
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().startRoom).toBe("H110");
      expect(getLatestRoomFieldsProps().endRoom).toBe("H111");
      expect(getLatestFloorProps().navigationPath).toEqual(["H110", "H111"]);
      expect(getLatestControlProps().mode).toBe("step");
    });

    await act(async () => {
      getLatestRoomFieldsProps().onChangeEndRoom("");
    });

    await waitFor(() => {
      expect(getLatestFloorProps().navigationPath).toBeUndefined();
      expect(getLatestControlProps().mode).toBe("floor");
      expect(getLatestRoomFieldsProps().routeError).toBeUndefined();
    });
  });

  it("shows an error when a manual room path cannot be found", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 100,
              y: 100,
              label: "H-110",
              accessible: true,
            },
            H111: {
              id: "H111",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 200,
              y: 100,
              label: "H-111",
              accessible: true,
            },
          },
          adjacencySet: {
            H110: {},
            H111: {},
          },
        },
        buildingCode: "H",
        rooms: ["H110", "H111"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    await act(async () => {
      const roomFieldsProps = getLatestRoomFieldsProps();
      roomFieldsProps.onChangeStartRoom("110");
      roomFieldsProps.onChangeEndRoom("111");
    });

    await act(async () => {
      getLatestRoomFieldsProps().onCreatePath();
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().routeError).toBe(
        "No indoor path was found between those rooms.",
      );
      expect(getLatestFloorProps().navigationPath).toBeUndefined();
    });
  });

  it("shows manual create-path errors for missing and unresolved typed locations", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 100,
              y: 100,
              label: "H-110",
              accessible: true,
            },
            H111: {
              id: "H111",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 200,
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

    await act(async () => {
      getLatestRoomFieldsProps().onCreatePath();
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().routeError).toBe(
        "Enter both a start location and an end location.",
      );
    });

    await act(async () => {
      const roomFieldsProps = getLatestRoomFieldsProps();
      roomFieldsProps.onChangeStartRoom("Mystery");
      roomFieldsProps.onChangeEndRoom("111");
    });

    await act(async () => {
      getLatestRoomFieldsProps().onCreatePath();
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().routeError).toBe(
        'Start location "Mystery" was not found.',
      );
    });

    await act(async () => {
      const roomFieldsProps = getLatestRoomFieldsProps();
      roomFieldsProps.onChangeStartRoom("110");
      roomFieldsProps.onChangeEndRoom("Unknown");
    });

    await act(async () => {
      getLatestRoomFieldsProps().onCreatePath();
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().routeError).toBe(
        'End location "Unknown" was not found.',
      );
    });
  });

  it("shows a lookup error when the canonical manual start location is missing from the graph", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1 },
        graphData: {
          checkpoints: {
            H111: {
              id: "H111",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 200,
              y: 100,
              label: "H-111",
              accessible: true,
            },
          },
          adjacencySet: {
            H111: {},
          },
        },
        buildingCode: "H",
        rooms: ["H110", "H111"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    await act(async () => {
      const roomFieldsProps = getLatestRoomFieldsProps();
      roomFieldsProps.onChangeStartRoom("110");
      roomFieldsProps.onChangeEndRoom("111");
    });

    await act(async () => {
      getLatestRoomFieldsProps().onCreatePath();
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().routeError).toBe(
        'Start location "H110" was not found.',
      );
    });
  });

  it("shows a lookup error when the canonical manual end location is missing from the graph", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 100,
              y: 100,
              label: "H-110",
              accessible: true,
            },
          },
          adjacencySet: {
            H110: {},
          },
        },
        buildingCode: "H",
        rooms: ["H110", "H111"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    await act(async () => {
      const roomFieldsProps = getLatestRoomFieldsProps();
      roomFieldsProps.onChangeStartRoom("110");
      roomFieldsProps.onChangeEndRoom("111");
    });

    await act(async () => {
      getLatestRoomFieldsProps().onCreatePath();
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().routeError).toBe(
        'End location "H111" was not found.',
      );
    });
  });

  it("navigates between floors when no indoor path is active", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
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
              x: 100,
              y: 100,
              accessible: true,
            },
          },
          adjacencySet: {
            H110: {},
          },
        },
        buildingCode: "H",
        rooms: ["H110"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    expect(getLatestControlProps().mode).toBe("floor");
    expect(getLatestFloorProps().floor).toBe(1);

    await act(async () => {
      getLatestControlProps().onNext();
    });

    await waitFor(() => {
      expect(getLatestFloorProps().floor).toBe(2);
      expect(getLatestControlProps().canGoPrevious).toBe(true);
    });

    await act(async () => {
      getLatestControlProps().onNext();
    });

    await waitFor(() => {
      expect(getLatestFloorProps().floor).toBe(3);
      expect(getLatestControlProps().canGoNext).toBe(false);
    });

    await act(async () => {
      getLatestControlProps().onPrevious();
    });

    await waitFor(() => {
      expect(getLatestFloorProps().floor).toBe(2);
    });
  });

  it("reports invalid step-driven entry checkpoint parameters", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
      indoorStartCheckpointId: "missing",
      indoorEndRoom: "H110",
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 100,
              y: 100,
              label: "H-110",
              accessible: true,
            },
          },
          adjacencySet: {
            H110: {},
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
      expect(getLatestRoomFieldsProps().routeError).toBe(
        "Could not find the indoor entrance checkpoint for this route.",
      );
    });
  });

  it("reports route transition failures for step-driven room selections", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
      indoorStartRoom: ["H110"],
      indoorEndRoom: ["H111"],
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1 },
        graphData: {
          checkpoints: {
            H110: {
              id: "H110",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 100,
              y: 100,
              label: "H-110",
              accessible: true,
            },
            H111: {
              id: "H111",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 200,
              y: 100,
              label: "H-111",
              accessible: true,
            },
          },
          adjacencySet: {
            H110: {},
            H111: {},
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
      expect(getLatestRoomFieldsProps().routeError).toBe(
        "No indoor path was found for this transition.",
      );
      expect(getLatestFloorProps().navigationPath).toBeUndefined();
    });
  });

  it("clears saved resume continuations on unmount and surfaces query loading errors", async () => {
    const clearContinuationSpy = jest.spyOn(OutdoorStepResume, "clearContinuation");
    jest.spyOn(NavigationLoader, "loadBuildingData").mockResolvedValue(null);

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
      resumeContinuationId: ["resume-1"],
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        images: { 1: 1 },
        graphData: {
          checkpoints: {},
          adjacencySet: {},
        },
        buildingCode: "H",
        rooms: [],
      },
      error: null,
      isFetching: false,
    });

    const { unmount } = render(<IndoorMap />);

    const queryOptions = (useQuery as jest.Mock).mock.calls.at(-1)?.[0];
    await expect(queryOptions.queryFn()).rejects.toThrow("Couldn't load the floor info");

    unmount();

    expect(clearContinuationSpy).toHaveBeenCalledWith("resume-1");
  });
});
