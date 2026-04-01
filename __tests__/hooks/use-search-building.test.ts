import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useBuildingSearch, CURRENT_LOCATION_CODE } from "@/hooks/use-search-building";
import { Asset } from "expo-asset";

jest.mock("expo-asset", () => ({
  Asset: {
    fromModule: jest.fn(),
  },
}));
jest.mock("@/data/building-addresses.json", () => [
  {
    buildingCode: "H",
    buildingName: "Hall Building",
    address: "1455 De Maisonneuve",
    campus: "SGW",
  },
  {
    buildingCode: "LB",
    buildingName: "Library Building",
    address: "1400 De Maisonneuve",
    campus: "SGW",
  },
]);

describe("useBuildingSearch - Full Coverage Suite", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should initialize with empty queries and results", () => {
    const { result } = renderHook(() => useBuildingSearch({}));
    expect(result.current.queries.start).toBe("");
    expect(result.current.results.start).toEqual([]);
  });

  it("should handle null text in updateQuery", () => {
    const { result } = renderHook(() => useBuildingSearch({}));
    act(() => {
      result.current.updateQuery("start", null as unknown as string);
    });
    expect(result.current.queries.start).toBe("");
  });

  it("should early return if query length < 2 but still show building match", async () => {
    const { result } = renderHook(() => useBuildingSearch({}));
    act(() => {
      result.current.updateQuery("start", "H");
      jest.advanceTimersByTime(100);
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    // "H" matches "Hall Building" in standard results even if room search is skipped
    expect(result.current.results.start).toHaveLength(1);
    expect(result.current.results.start[0].buildingCode).toBe("H");
  });

  it("should early return if building code is not recognized", async () => {
    const { result } = renderHook(() => useBuildingSearch({}));
    act(() => {
      result.current.updateQuery("start", "XYZ123");
      jest.advanceTimersByTime(100);
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.current.results.start).toEqual([]);
  });

  it("should fetch and cache room results", async () => {
    const mockRoomData = JSON.stringify({ rooms: ["H963"] });
    (Asset.fromModule as jest.Mock).mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue(true),
      localUri: "mock-uri",
    });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(mockRoomData),
    });

    const { result } = renderHook(() => useBuildingSearch({}));

    act(() => {
      result.current.updateQuery("start", "H96");
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.results.start.some((r) => r.buildingName === "H963")).toBe(
        true,
      );
    });

    act(() => {
      result.current.updateQuery("start", "H963");
      jest.advanceTimersByTime(100);
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle fetch error, log to console, and return building only", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const networkError = new Error("File not found: 404");
    (Asset.fromModule as jest.Mock).mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue(true),
      localUri: "mock-uri",
    });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      text: jest.fn().mockRejectedValue(networkError),
    });

    const { result } = renderHook(() => useBuildingSearch({}));

    act(() => {
      result.current.updateQuery("start", "H96");
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.results.start).toHaveLength(1);
      expect(result.current.results.start.some((r) => r.buildingCode === "H")).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unable to fetch building file for H"),
        networkError,
      );
    });

    consoleSpy.mockRestore();
  });

  it("should handle malformed JSON gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (Asset.fromModule as jest.Mock).mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue(true),
      localUri: "mock-uri",
    });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue("invalid-json"),
    });

    const { result } = renderHook(() => useBuildingSearch({}));
    act(() => {
      result.current.updateQuery("start", "H96");
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.results.start).toHaveLength(1);
      expect(result.current.results.start.some((r) => r.buildingCode === "H")).toBe(true);
    });
    consoleSpy.mockRestore();
  });

  it("should prioritize currentBuildingCodes for 'start' field", async () => {
    const currentBuildingCodes = new Set(["LB"]);
    const { result } = renderHook(() => useBuildingSearch({ currentBuildingCodes }));

    act(() => {
      result.current.updateQuery("start", "LB");
    });

    await waitFor(() => {
      expect(result.current.results.start[0].buildingCode).toBe("LB");
    });

    act(() => {
      result.current.updateQuery("end", "H");
    });
    await waitFor(() => {
      expect(result.current.results.end[0].buildingCode).toBe("H");
    });
  });

  it("should show current location sentinel", () => {
    const { result } = renderHook(() => useBuildingSearch({ hasUserLocation: true }));
    act(() => {
      result.current.updateQuery("start", "gps");
    });
    expect(result.current.results.start[0].buildingCode).toBe(CURRENT_LOCATION_CODE);
  });

  it("should swap queries", () => {
    const { result } = renderHook(() => useBuildingSearch({}));
    act(() => {
      result.current.updateQuery("start", "H");
      result.current.updateQuery("end", "LB");
      result.current.swapQueries();
    });
    expect(result.current.queries.start).toBe("LB");
    expect(result.current.queries.end).toBe("H");
  });
});
