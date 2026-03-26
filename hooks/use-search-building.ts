import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { SearchBuilding, FieldType } from "@/types/buildingTypes";
import buildingAddressesRaw from "@/data/building-addresses.json";

export const CURRENT_LOCATION_CODE = "CURRENT_LOCATION";
const buildingAddresses = buildingAddressesRaw as SearchBuilding[];

const CURRENT_LOCATION_SENTINEL: SearchBuilding = {
  buildingCode: CURRENT_LOCATION_CODE,
  buildingName: "Current Location",
  address: "Your current GPS position",
  campus: "",
};

export function useBuildingSearch({
  currentBuildingCodes = new Set(),
  hasUserLocation = false,
}: {
  currentBuildingCodes?: Set<string>;
  hasUserLocation?: boolean;
}) {
  const [queries, setQueries] = useState<Record<FieldType, string>>({
    start: "",
    end: "",
  });
  // TODO: to be incorporate before the building results later
  const [roomResults, setRoomResults] = useState<Record<FieldType, SearchBuilding[]>>({
    start: [],
    end: [],
  });
  const roomCache = useRef<Map<string, string[]>>(new Map());

  const updateQuery = useCallback((type: FieldType, text: string | null) => {
    setQueries((prev) => ({ ...prev, [type]: text || "" }));
  }, []);

  const swapQueries = useCallback(() => {
    setQueries((prev) => ({ start: prev.end, end: prev.start }));
  }, []);

  const searchRooms = useCallback(async (query: string, type: FieldType) => {
    const q = (query || "").trim().toUpperCase();

    if (q.length < 2) {
      setRoomResults((prev) => ({ ...prev, [type]: [] }));
      return;
    }

    const buildingCode = buildingAddresses.find((b) =>
      q.startsWith(b.buildingCode),
    )?.buildingCode;
    if (!buildingCode) {
      setRoomResults((prev) => ({ ...prev, [type]: [] }));
      return;
    }

    try {
      let allRooms: string[] = [];
      if (roomCache.current.has(buildingCode)) {
        allRooms = roomCache.current.get(buildingCode)!;
      } else {
        const response = await fetch(
          `@/data/indoorMapData/${buildingCode}_floor_plan.json.txt`,
        );
        const data = await response.json().catch(() => new Object())
        allRooms = data.rooms || [];
        roomCache.current.set(buildingCode, allRooms);
      }

      const targetBuilding = buildingAddresses.find(
        (b) => b.buildingCode === buildingCode,
      );
      if (!targetBuilding) return;

      const matchedRooms = allRooms
        .filter((room) => room.toUpperCase().includes(q))
        .slice(0, 8)
        .map((roomStr) => ({
          ...targetBuilding,
          buildingName: roomStr,
          buildingCode: roomStr,
          address: targetBuilding.address || "",
          campus: targetBuilding.campus || "",
        }));

      setRoomResults((prev) => ({ ...prev, [type]: matchedRooms }));
    } catch {
      setRoomResults((prev) => ({ ...prev, [type]: [] }));
    }
  }, []);

  useEffect(() => {
    if (!queries.start.trim() && !queries.end.trim()) {
      searchRooms("", "start");
      searchRooms("", "end");
      return;
    }

    // Small debounce helps React process the "Selection" before
    // starting a new search cycle
    const delayDebounceFn = setTimeout(() => {
      searchRooms(queries.start, "start");
      searchRooms(queries.end, "end");
    }, 100);

    return () => clearTimeout(delayDebounceFn);
  }, [queries.start, queries.end, searchRooms]);

  const results = useMemo(() => {
    const getStandardResults = (q: string, fieldType: FieldType) => {
      const safeQ = (q || "").toLowerCase().trim();
      if (!safeQ) return [];

      let filtered = (buildingAddressesRaw as SearchBuilding[]).filter(
        (b) =>
          (b.buildingName || "").toLowerCase().includes(safeQ) ||
          (b.buildingCode || "").toLowerCase().includes(safeQ),
      );

      if (
        hasUserLocation &&
        ("current location".includes(safeQ) || "gps".includes(safeQ))
      ) {
        filtered = [CURRENT_LOCATION_SENTINEL, ...filtered];
      }

      if (
        fieldType === "start" &&
        currentBuildingCodes &&
        currentBuildingCodes.size > 0
      ) {
        const inside = filtered.filter((b) => currentBuildingCodes.has(b.buildingCode));
        const outside = filtered.filter((b) => !currentBuildingCodes.has(b.buildingCode));
        return [...inside, ...outside];
      }

      return filtered;
    };

    return {
      start: [...getStandardResults(queries.start, "start")],
      end: [...getStandardResults(queries.end, "end")],
    };
  }, [queries, hasUserLocation, currentBuildingCodes]); // Added currentBuildingCodes to dependency array

  return { queries, updateQuery, swapQueries, results };
}
