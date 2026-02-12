import { isPointInPolygon } from "../utils/currentBuilding/pointInPolygon";
import { Coordinate, Polygon } from "../types/mapTypes";


describe("isPointInPolygon", () => {

  // This polygon represents the B Annex building on the Loyola campus
  const bAnnexPolygon: Polygon = [
    { latitude: 45.4979631908601, longitude: -73.5795371416831 },
    { latitude: 45.4977850408341, longitude: -73.5797038854998 },
    { latitude: 45.49774788844,   longitude: -73.5796280890596 },
    { latitude: 45.4979205685552, longitude: -73.5794612989859 },
    { latitude: 45.4979631908601, longitude: -73.5795371416831 },
  ];

  it("returns true if point is inside the polygon", () => {
    const insideLocation: Coordinate = {
      latitude: 45.497854, 
      longitude: -73.579582, 
    };

    const result = isPointInPolygon(insideLocation, bAnnexPolygon);

    expect(result).toBe(true);
  });

  it("returns false if point is outside the polygon", () => {
    const outsideLocation: Coordinate = {
      latitude: 45.4985,
      longitude: -73.5799,
    };

    const result = isPointInPolygon(outsideLocation, bAnnexPolygon);

    expect(result).toBe(false);
  });

  it("returns false if point is exactly on the vertex of the polygon", () => {
    const edgeLocation: Coordinate = {
      latitude: 45.4979631908601, 
      longitude: -73.5795371416831, 
    };

    const result = isPointInPolygon(edgeLocation, bAnnexPolygon);
    expect(result).toBe(false);
  });
});
