import { isPointInPolygon } from "../utils/currentBuilding/pointInPolygon";
import { Coordinate } from "../types/mapTypes";
import { CAMPUS_LOCATIONS } from "../constants/mapData";

/**
 * Tests for the point-in-polygon algorithm used to determine if a user's location
 * is within a specific building's boundaries. This is critical for highlighting
 * the user's current building on the map.
 */
describe("isPointInPolygon", () => {

  // Get the B Annex building polygon from the actual data source
  const bAnnexBuilding = CAMPUS_LOCATIONS.find(building => building.code === "B");
  if (!bAnnexBuilding) {
    throw new Error("B Annex building not found in CAMPUS_LOCATIONS");
  }
  const bAnnexPolygon = bAnnexBuilding.polygons[0];

  it("should return true when a coordinate is inside the B Annex building polygon", () => {
    // This coordinate is confirmed to be within the B Annex building boundaries
    const insideLocation: Coordinate = {
      latitude: 45.497854, 
      longitude: -73.579582, 
    };

    const result = isPointInPolygon(insideLocation, bAnnexPolygon);

    expect(result).toBe(true);
  });

  it("should return false when a coordinate is outside the B Annex building polygon", () => {
    // This coordinate is north of the B Annex building, outside its boundaries
    const outsideLocation: Coordinate = {
      latitude: 45.4985,
      longitude: -73.5799,
    };

    const result = isPointInPolygon(outsideLocation, bAnnexPolygon);

    expect(result).toBe(false);
  });

  it("should return false when a coordinate is exactly on a vertex of the polygon", () => {
    // Edge case: Points exactly on the boundary are considered outside
    // This is the first vertex of the B Annex polygon
    const vertexLocation: Coordinate = {
      latitude: 45.4979631908601, 
      longitude: -73.5795371416831, 
    };

    const result = isPointInPolygon(vertexLocation, bAnnexPolygon);
    expect(result).toBe(false);
  });
});
