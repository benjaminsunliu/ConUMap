import { calculateDistance } from "@/hooks/use-poi";
import { LOY_CENTER, SGW_CENTER } from "@/constants/campusCenters";

describe("calculateDistance", () => {
  it("returns zero for identical coordinates", () => {
    const distance = calculateDistance(
      SGW_CENTER.latitude,
      SGW_CENTER.longitude,
      SGW_CENTER.latitude,
      SGW_CENTER.longitude,
    );

    expect(distance).toBe(0);
  });

  it("is symmetric regardless of coordinate order", () => {
    const forward = calculateDistance(
      SGW_CENTER.latitude,
      SGW_CENTER.longitude,
      LOY_CENTER.latitude,
      LOY_CENTER.longitude,
    );

    const backward = calculateDistance(
      LOY_CENTER.latitude,
      LOY_CENTER.longitude,
      SGW_CENTER.latitude,
      SGW_CENTER.longitude,
    );

    expect(forward).toBeCloseTo(backward, 6);
  });

  it("matches expected distance for one degree longitude at the equator", () => {
    const distance = calculateDistance(0, 0, 0, 1);

    expect(distance).toBeGreaterThan(111000);
    expect(distance).toBeLessThan(111500);
  });

  // By checking online the number was found to be around 6400m
  it("returns a realistic SGW-to-LOY distance", () => {
    const distance = calculateDistance(
      SGW_CENTER.latitude,
      SGW_CENTER.longitude,
      LOY_CENTER.latitude,
      LOY_CENTER.longitude,
    );

    expect(distance).toBeGreaterThan(6300);
    expect(distance).toBeLessThan(6500);
  });
});
