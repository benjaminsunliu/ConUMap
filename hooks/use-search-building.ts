import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { SearchBuilding, FieldType } from "@/types/buildingTypes";
import buildingAddressesRaw from "@/data/building-addresses.json";
import { Asset } from "expo-asset";

export const CURRENT_LOCATION_CODE = "CURRENT_LOCATION";
const buildingAddresses = buildingAddressesRaw as SearchBuilding[];

const CURRENT_LOCATION_SENTINEL: SearchBuilding = {
  buildingCode: CURRENT_LOCATION_CODE,
  buildingName: "Current Location",
  address: "Your current GPS position",
  campus: "",
};

const loadBuildingFile = async (buildingCode: string) => {
  const assetMap: Record<string, string> = {
    CC: require("../data/indoorMapData/jsonGraphs/CC_floor_plan.json.txt"),
    H: require("../data/indoorMapData/jsonGraphs/H_floor_plan.json.txt"),
    LB: require("../data/indoorMapData/jsonGraphs/LB_floor_plan.json.txt"),
    MB: require("../data/indoorMapData/jsonGraphs/MB_floor_plan.json.txt"),
    VE: require("../data/indoorMapData/jsonGraphs/VE_floor_plan.json.txt"),
    VL: require("../data/indoorMapData/jsonGraphs/VL_floor_plan.json.txt"),
  };

  const asset = Asset.fromModule(assetMap[buildingCode]);
  await asset.downloadAsync();

  if (!asset.localUri) return [];
  const content = await fetch(asset.localUri)
    .then((res) => {
      if (!res.ok) throw new Error(`File not found: ${res.status}`);
      return res.text();
    })
    .catch((e) => {
      console.error(`Unable to fetch building file for ${buildingCode}`, e);
      return "{}";
    });
  return JSON.parse(content);
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
    
    // if the query is empty, return nothing
    if (q.length < 1) {
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
        const data = await loadBuildingFile(buildingCode);
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
      if (!safeQ) return []

      const buildingFromQuery = (buildingAddressesRaw as SearchBuilding[]).find(
       (b) => safeQ.startsWith(b.buildingCode.toLowerCase()) || b.buildingName.toLowerCase().includes(safeQ)
      );
      let filtered = (buildingAddressesRaw as SearchBuilding[]).filter(
        (b) =>
          (b.buildingName || "").toLowerCase().includes(safeQ) ||
          (b.buildingCode || "").toLowerCase().includes(safeQ) ||
          (b.buildingCode === buildingFromQuery?.buildingCode)
      );

      // 1. Sort with tiered priority: 
      // Tier 1: In currentBuildingCodes
      // Tier 2: Building code starts with query
      // Tier 3: Building name starts with query
      // Tier 4: Everything else (includes/substrings)
      const sortedBuildings = [...filtered].sort((a, b) => {
        const aCode = a.buildingCode.toLowerCase();
        const bCode = b.buildingCode.toLowerCase();
        const aName = (a.buildingName || "").toLowerCase();
        const bName = (b.buildingName || "").toLowerCase();
    
        // Priority 1: Current Building
        const aIsCurrent = currentBuildingCodes.has(a.buildingCode) ? 1 : 0;
        const bIsCurrent = currentBuildingCodes.has(b.buildingCode) ? 1 : 0;
        if (aIsCurrent !== bIsCurrent) return bIsCurrent - aIsCurrent;
    
        // Priority 2: Code starts with query
        const aStartsCode = aCode.startsWith(safeQ) ? 1 : 0;
        const bStartsCode = bCode.startsWith(safeQ) ? 1 : 0;
        if (aStartsCode !== bStartsCode) return bStartsCode - aStartsCode;
    
        // Priority 3: Name starts with query
        const aStartsName = aName.startsWith(safeQ) ? 1 : 0;
        const bStartsName = bName.startsWith(safeQ) ? 1 : 0;
        if (aStartsName !== bStartsName) return bStartsName - aStartsName;
    
        // Default: Alphabetical by code
        return aCode.localeCompare(bCode);
      });

      if (hasUserLocation && ("current location".includes(safeQ) || "gps".includes(safeQ))) {
        return [CURRENT_LOCATION_SENTINEL, ...sortedBuildings];
      }

      return sortedBuildings;
    };

    return {
      start: [...getStandardResults(queries.start, "start"), ...roomResults.start],
      end: [...getStandardResults(queries.end, "end"), ...roomResults.end],
    };
  }, [
    queries.start,
    queries.end,
    roomResults.start,
    roomResults.end,
    hasUserLocation,
    currentBuildingCodes,
  ]); // Added currentBuildingCodes to dependency array

  return { queries, updateQuery, swapQueries, results };
}
