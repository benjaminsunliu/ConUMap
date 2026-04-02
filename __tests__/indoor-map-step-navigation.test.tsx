import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import IndoorMap from "@/app/(tabs)/(map)/[buildingCode]";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

const mockBuildingFloor = jest.fn((_: any) => null);
const mockIndoorRoomFields = jest.fn((_: any) => null);

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(),
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
jest.mock("@/components/map/indoor-navigation-controls", () => () => null);

describe("IndoorMap step-driven navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(floorProps.navigationPath).toEqual([
        "H_F2_building_entry_exit_15",
        "H110",
      ]);
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
      expect(floorProps.navigationPath).toEqual([
        "H110",
        "H_F2_building_entry_exit_15",
      ]);
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
});
