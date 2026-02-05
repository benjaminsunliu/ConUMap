import { Building, Polygon, Campus, Coordinate } from "@/types/mapTypes";
import buildingPolygons from "@/data/buildings-polygons.json";

export function arrayToBuildingPolygon(polygon: number[][]) {
  const buildingPolygon: Polygon = polygon.map((coordinate) => {
    const position: Coordinate = {
      latitude: coordinate[1],
      longitude: coordinate[0],
    };
    return position;
  });
  return buildingPolygon;
}

export const CAMPUS_LOCATIONS: Campus = buildingPolygons.map((buildingInfo) => {
  const display_polygon = buildingInfo.buildings[0].building_outlines[0].display_polygon;
  const location: Coordinate = {
    latitude: buildingInfo.geometry.location.lat,
    longitude: buildingInfo.geometry.location.lng,
  };

  const isPolygon = display_polygon.type === "MultiPolygon";
  const multipleCoordinates = display_polygon.coordinates;
  const buildingPolygons: Polygon[] = [];

  // sometimes a "building" can have multiple polygons that represent it
  multipleCoordinates.forEach((buildingsCoordinates) => {
    if (isPolygon) {
      const manyBuildings = buildingsCoordinates as number[][][];
      manyBuildings.forEach((buildingCoordinates) => {
        const polygon = arrayToBuildingPolygon(buildingCoordinates);
        buildingPolygons.push(polygon);
      });
    } else {
      const oneBuildingCoordinates = buildingsCoordinates as number[][];
      const polygon = arrayToBuildingPolygon(oneBuildingCoordinates);
      buildingPolygons.push(polygon);
    }
  });

  const building: Building = {
    code: buildingInfo.buildingCode,
    polygons: buildingPolygons,
    location,
  };
  return building;
});
