import { CAMPUS_BUILDINGS } from "@/constants/map";

function getBuilding(buildingCode: string) {
  const building = CAMPUS_BUILDINGS.find(
    (candidate) => candidate.buildingCode === buildingCode,
  );

  expect(building).toBeDefined();

  if (!building) {
    throw new Error(`Missing building data for ${buildingCode}`);
  }

  return building;
}

describe("Bishop annex polygons", () => {
  it("keeps MU Annex distinct from B Annex", () => {
    const mu = getBuilding("MU");
    const b = getBuilding("B");

    expect(mu.polygons).not.toEqual(b.polygons);
    expect(mu.location).not.toEqual(b.location);
  });

  it("preserves the Bishop Street annex order from west to east", () => {
    const expectedOrder = ["MU", "B", "K", "D", "MI"];

    const actualOrder = expectedOrder
      .map(getBuilding)
      .sort((left, right) => left.location.longitude - right.location.longitude)
      .map((building) => building.buildingCode);

    expect(actualOrder).toEqual(expectedOrder);
  });

  it("retains MI Annex polygon data", () => {
    const mi = getBuilding("MI");

    expect(mi.polygons.length).toBeGreaterThan(0);
    expect(mi.polygons[0].length).toBeGreaterThan(3);
  });
});
