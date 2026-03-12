import { renderHook, act } from "@testing-library/react-native";
import { useE2EHitboxOverlay } from "@/hooks/useE2EHitboxOverlay";
import { CAMPUS_BUILDINGS } from "@/constants/map";

const region = {
  latitude: 45.495,
  longitude: -73.579,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

jest.mock("@/constants/map", () => ({
  CAMPUS_BUILDINGS: [
    {
      buildingName: "ER Building",
      buildingCode: "ER",
      address: "2155 Guy St., Montreal, QC",
      campus: "SGW",
      overview: [],
      accessibility: [],
      url: "",
      location: {
        latitude: 45.49615,
        longitude: -73.58016,
      },
      polygons: [],
    },
    {
      buildingName: "CI Annex",
      buildingCode: "CI",
      address: "2149 Mackay St., Montreal, QC",
      campus: "SGW",
      overview: [],
      accessibility: [],
      url: "",
      location: {
        latitude: 45.49683,
        longitude: -73.57941,
      },
      polygons: [],
    },
  ],
}));

async function waitForEffects() {
  await act(async () => {});
}

describe("useE2EHitboxOverlay", () => {
  let mapViewRef: any;
  let setProjectedPoints: jest.Mock;

  beforeEach(() => {
    setProjectedPoints = jest.fn();

    mapViewRef = {
      current: {
        pointForCoordinate: jest.fn(),
      },
    };
  });

  it("does nothing when currentRegion is null", () => {
    renderHook(() =>
      useE2EHitboxOverlay({
        currentRegion: null,
        mapViewRef,
        setProjectedPoints,
      }),
    );

    expect(setProjectedPoints).not.toHaveBeenCalled();
  });

  it("clears points when mapViewRef.current is null", () => {
    mapViewRef.current = null;

    renderHook(() =>
      useE2EHitboxOverlay({
        currentRegion: region,
        mapViewRef,
        setProjectedPoints,
      }),
    );

    expect(setProjectedPoints).toHaveBeenCalledWith([]);
  });

  it("does not clear points when there are visible buildings", async () => {
    const visible = CAMPUS_BUILDINGS;

    mapViewRef.current.pointForCoordinate
      .mockResolvedValueOnce({ x: 10, y: 20 })
      .mockResolvedValueOnce({ x: 30, y: 40 });

    renderHook(() =>
      useE2EHitboxOverlay({
        currentRegion: region,
        mapViewRef,
        setProjectedPoints,
      }),
    );

    await waitForEffects();

    expect(setProjectedPoints).toHaveBeenCalledWith([
      { building: visible[0], x: 10, y: 20 },
      { building: visible[1], x: 30, y: 40 },
    ]);
  });

  it("warns and clears points when projection returns null", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    mapViewRef.current.pointForCoordinate
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ x: 10, y: 20 });

    renderHook(() =>
      useE2EHitboxOverlay({
        currentRegion: region,
        mapViewRef,
        setProjectedPoints,
      }),
    );

    await waitForEffects();

    expect(setProjectedPoints).toHaveBeenCalledWith([]);
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to update hitbox positions",
      expect.any(Error),
    );
  });
});
