import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import IndoorMap from "@/app/(tabs)/(map)/[buildingCode]";
import { IndoorMapSettings } from "@/globals/IndoorMapSettingsStore";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";

const mockBuildingFloor = jest.fn((_: any) => null);
const mockIndoorRoomFields = jest.fn((_: any) => null);
const mockMapSettings = jest.fn((_: any) => null);

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

jest.mock("@/components/map/indoor-map-settings", () => (props: unknown) => {
  mockMapSettings(props);
  return null;
});

jest.mock("@/components/map/indoor-navigation-controls", () => () => null);

const getLatestFloorProps = () => mockBuildingFloor.mock.calls.at(-1)?.[0] as any;
const getLatestRoomFieldsProps = () => mockIndoorRoomFields.mock.calls.at(-1)?.[0] as any;
const getLatestMapSettingsProps = () => mockMapSettings.mock.calls.at(-1)?.[0] as any;

describe("IndoorMap wheelchair routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    IndoorMapSettings.reset();
    (SecureStore as any).__reset();
  });

  it("reroutes an existing manual path when wheelchair accessibility is turned on", async () => {
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
              x: 0,
              y: 0,
              label: "H-110",
              accessible: true,
            },
            Shortcut: {
              id: "Shortcut",
              type: "hallway_waypoint",
              buildingId: "H",
              floor: 1,
              x: 50,
              y: 0,
              accessible: true,
            },
            Detour: {
              id: "Detour",
              type: "hallway_waypoint",
              buildingId: "H",
              floor: 1,
              x: 0,
              y: 50,
              accessible: true,
            },
            H210: {
              id: "H210",
              type: "doorway",
              buildingId: "H",
              floor: 1,
              x: 50,
              y: 50,
              label: "H-210",
              accessible: true,
            },
          },
          adjacencySet: {
            H110: {
              Shortcut: {
                source: "H110",
                target: "Shortcut",
                type: "hallway",
                weight: 1,
                accessible: false,
              },
              Detour: {
                source: "H110",
                target: "Detour",
                type: "hallway",
                weight: 3,
                accessible: true,
              },
            },
            Shortcut: {
              H110: {
                source: "Shortcut",
                target: "H110",
                type: "hallway",
                weight: 1,
                accessible: false,
              },
              H210: {
                source: "Shortcut",
                target: "H210",
                type: "hallway",
                weight: 1,
                accessible: false,
              },
            },
            Detour: {
              H110: {
                source: "Detour",
                target: "H110",
                type: "hallway",
                weight: 3,
                accessible: true,
              },
              H210: {
                source: "Detour",
                target: "H210",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
            H210: {
              Shortcut: {
                source: "H210",
                target: "Shortcut",
                type: "hallway",
                weight: 1,
                accessible: false,
              },
              Detour: {
                source: "H210",
                target: "Detour",
                type: "hallway",
                weight: 1,
                accessible: true,
              },
            },
          },
        },
        buildingCode: "H",
        rooms: ["H110", "H210"],
      },
      error: null,
      isFetching: false,
    });

    render(<IndoorMap />);

    await act(async () => {
      getLatestRoomFieldsProps().onChangeStartRoom("H110");
      getLatestRoomFieldsProps().onChangeEndRoom("H210");
    });

    await waitFor(() => {
      expect(getLatestRoomFieldsProps().startRoom).toBe("H110");
      expect(getLatestRoomFieldsProps().endRoom).toBe("H210");
    });

    await act(async () => {
      getLatestRoomFieldsProps().onCreatePath();
    });

    await waitFor(() => {
      expect(getLatestFloorProps().navigationPath).toEqual([
        "H110",
        "Shortcut",
        "H210",
      ]);
    });

    await act(async () => {
      getLatestMapSettingsProps().setWheelchairOnly(true);
    });

    await waitFor(() => {
      expect(getLatestMapSettingsProps().wheelchairOnly).toBe(true);
      expect(getLatestFloorProps().navigationPath).toEqual([
        "H110",
        "Detour",
        "H210",
      ]);
    });
  });

  it("restores the wheelchair toggle after leaving and re-entering indoor mode", async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      buildingCode: "H",
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

    const firstRender = render(<IndoorMap />);

    await waitFor(() => {
      expect(getLatestMapSettingsProps().wheelchairOnly).toBe(false);
    });

    await act(async () => {
      getLatestMapSettingsProps().setWheelchairOnly(true);
    });

    await waitFor(() => {
      expect(getLatestMapSettingsProps().wheelchairOnly).toBe(true);
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "indoorMapSettings",
      JSON.stringify({ wheelchairOnly: true }),
    );

    firstRender.unmount();
    IndoorMapSettings.reset();

    render(<IndoorMap />);

    await waitFor(() => {
      expect(getLatestMapSettingsProps().wheelchairOnly).toBe(true);
    });
  });
});
