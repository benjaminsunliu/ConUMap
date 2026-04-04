import {
  LOY_CENTER,
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
  SGW_CENTER,
} from "@/constants/campusCenters";

describe("campusCenters constants", () => {
  it("exports SGW center coordinates", () => {
    expect(SGW_CENTER).toEqual({
      latitude: 45.4957849,
      longitude: -73.577225,
    });
  });

  it("exports LOY center coordinates", () => {
    expect(LOY_CENTER).toEqual({
      latitude: 45.4578596,
      longitude: -73.6395856,
    });
  });

  it("exports valid radius bounds", () => {
    expect(MIN_RADIUS_METERS).toBe(0);
    expect(MAX_RADIUS_METERS).toBe(1000);
    expect(MAX_RADIUS_METERS).toBeGreaterThan(MIN_RADIUS_METERS);
  });
});
