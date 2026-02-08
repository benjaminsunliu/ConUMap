import { calculateDistance, findClosestBuilding } from "../utils/distance";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

describe("calculateDistance", () => {
  it("returns 0 for the same coordinates", () => {
    const coord = { latitude: 45.4973, longitude: -73.5789 };
    const distance = calculateDistance(coord, coord);
    expect(distance).toBeCloseTo(0, 5);
  });

  it("returns a positive distance for different coordinates", () => {
    const a = { latitude: 45.4973, longitude: -73.5789 };
    const b = { latitude: 45.4582, longitude: -73.6405 };
    const distance = calculateDistance(a, b);
    expect(distance).toBeGreaterThan(0);
  });
});

describe("findClosestBuilding", () => {
  it("returns the closest building code", () => {
    const userLocation = { latitude: 45.4973, longitude: -73.5789 };

    const buildings = [
      {
        code: "H",
        location: { latitude: 45.4582, longitude: -73.6405 },
      },
      {
        code: "EV",
        location: { latitude: 45.4959, longitude: -73.5778 },
      },
    ];

    const result = findClosestBuilding(userLocation, buildings);
    expect(result).toBe("EV");
  });

  it("returns null if no buildings are provided", () => {
    const userLocation = { latitude: 45.4973, longitude: -73.5789 };
    const result = findClosestBuilding(userLocation, []);
    expect(result).toBeNull();
  });
});