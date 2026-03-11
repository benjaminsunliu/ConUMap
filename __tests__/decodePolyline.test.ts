import { decodePolyline } from "@/utils/decodePolyline";

describe("decodePolyline", () => {
  it("decodes a known Google polyline string correctly", () => {
    // example from Google's Polyline Encoding Algorithm documentation
    const encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    const result = decodePolyline(encoded);
    expect(result).toHaveLength(3);
    expect(result[0].latitude).toBeCloseTo(38.5, 3);
    expect(result[0].longitude).toBeCloseTo(-120.2, 3);
    expect(result[1].latitude).toBeCloseTo(40.7, 3);
    expect(result[1].longitude).toBeCloseTo(-120.95, 3);
    expect(result[2].latitude).toBeCloseTo(43.252, 3);
    expect(result[2].longitude).toBeCloseTo(-126.453, 3);
  });

  it("returns an empty array for an empty string", () => {
    const result = decodePolyline("");
    expect(result).toEqual([]);
  });

  it("returns a single coordinate (0, 0) for the minimal valid encoding '??'", () => {
    const result = decodePolyline("??");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ latitude: 0, longitude: 0 });
  });

  it("returns objects with latitude and longitude number properties", () => {
    const encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    const result = decodePolyline(encoded);
    result.forEach((coord) => {
      expect(coord).toHaveProperty("latitude");
      expect(coord).toHaveProperty("longitude");
      expect(typeof coord.latitude).toBe("number");
      expect(typeof coord.longitude).toBe("number");
    });
  });

  it("correctly decodes negative longitudes (western hemisphere)", () => {
    // example has strongly negative longitudes (-120s range)
    const encoded = "_p~iF~ps|U";
    const result = decodePolyline(encoded);
    expect(result[0].longitude).toBeLessThan(0);
  });

  it("decodes a real Montreal-area polyline from mock route data", () => {
    const encoded = "{tvtGroa`M@?Ne@Ri@N]HGEQz@wBrAeDHO@ELOCC";
    const result = decodePolyline(encoded);
    expect(result.length).toBeGreaterThan(0);
    // All points should be approximately in the Montreal area
    result.forEach((coord) => {
      expect(coord.latitude).toBeGreaterThan(45.4);
      expect(coord.latitude).toBeLessThan(45.6);
      expect(coord.longitude).toBeGreaterThan(-73.7);
      expect(coord.longitude).toBeLessThan(-73.4);
    });
  });

  it("decodes another Montreal-area segment correctly", () => {
    const encoded =
      "mswtGb}~_Mz@aCl@eBHQPe@Xy@FMVu@He@RW`@gA?Cx@_Cb@oAFQhA{C?A^cALa@@EJWBIDMFODMBIFOFUFOFORk@Vy@LWFUTs@BMN_@@EFMH[`@sAPk@";
    const result = decodePolyline(encoded);
    expect(result.length).toBeGreaterThan(5);
    result.forEach((coord) => {
      expect(coord.latitude).toBeGreaterThan(45.4);
      expect(coord.latitude).toBeLessThan(45.6);
      expect(coord.longitude).toBeGreaterThan(-73.7);
      expect(coord.longitude).toBeLessThan(-73.4);
    });
  });

  it("handles a polyline with a single point encoded at a non-zero position", () => {
    const encoded = "_ibE_ibE";
    const result = decodePolyline(encoded);
    expect(result).toHaveLength(1);
    expect(result[0].latitude).toBeCloseTo(1.0, 4);
    expect(result[0].longitude).toBeCloseTo(1.0, 4);
  });

  it("delta-decodes consecutive points correctly (each point is relative to previous)", () => {
    const encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    const result = decodePolyline(encoded);
    // Each subsequent coordinate should differ from previous
    expect(result[1].latitude).not.toBeCloseTo(result[0].latitude, 1);
  });
});
