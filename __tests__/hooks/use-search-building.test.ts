import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useBuildingSearch, CURRENT_LOCATION_CODE } from "@/hooks/use-search-building";

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
    global.fetch = jest.fn();
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
    expect(global.fetch).not.toHaveBeenCalled();
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
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.results.start).toEqual([]);
  });

  it("should fetch and cache room results", async () => {
    const mockRoomData = { rooms: ["H963"] };
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockRoomData),
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

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle fetch error in catch block and keep matching buildings", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network Fail"));
    const { result } = renderHook(() => useBuildingSearch({}));

    act(() => {
      // Use "H" so standard results still find the Hall building
      result.current.updateQuery("start", "H");
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.results.start).toHaveLength(1);
      expect(result.current.results.start[0].buildingCode).toBe("H");
    });
  });

  it("should handle malformed JSON gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockRejectedValue(new Error("JSON Error")),
    });

    const { result } = renderHook(() => useBuildingSearch({}));
    act(() => {
      result.current.updateQuery("start", "H");
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.results.start).toHaveLength(1);
    });
  });

  it("should prioritize currentBuildingCodes for 'start' field", () => {
    const currentBuildingCodes = new Set(["LB"]);
    const { result } = renderHook(() => useBuildingSearch({ currentBuildingCodes }));

    act(() => {
      result.current.updateQuery("start", "Building");
    });
    expect(result.current.results.start[0].buildingCode).toBe("LB");

    act(() => {
      result.current.updateQuery("end", "Building");
    });
    expect(result.current.results.end[0].buildingCode).toBe("H");
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
