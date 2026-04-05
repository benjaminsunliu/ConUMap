import {
  buildRoomLookup,
  getRoomSearchTokens,
  getRoomTokens,
  normalizeSearchToken,
  resolveCanonicalRoom,
} from "@/utils/roomSearch";

describe("roomSearch utilities", () => {
  const buildingCode = "LB";
  const roomSuggestions = ["LB 207", "LB-3", "LB 5.201"];

  it("normalizes room queries and preserves building-prefix variants", () => {
    expect(getRoomSearchTokens("207", buildingCode)).toEqual(["207", "LB207"]);
    expect(getRoomSearchTokens("LB-3", buildingCode)).toEqual(["LB3"]);
  });

  it("builds searchable tokens for room suggestions", () => {
    expect(getRoomTokens("LB 5.201", buildingCode)).toEqual(["LB5201", "5201"]);
  });

  it("resolves shorthand and full input to canonical room values", () => {
    const lookup = buildRoomLookup(roomSuggestions, buildingCode);

    expect(resolveCanonicalRoom("207", buildingCode, lookup)).toBe("LB 207");
    expect(resolveCanonicalRoom("LB5201", buildingCode, lookup)).toBe("LB 5.201");
    expect(resolveCanonicalRoom("UNKNOWN", buildingCode, lookup)).toBeUndefined();
  });

  it("normalizes tokens to uppercase alphanumeric characters", () => {
    expect(normalizeSearchToken(" lb-5.201 ")).toBe("LB5201");
  });
});
