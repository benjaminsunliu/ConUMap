import { Building, Polygon, Campus, Coordinate } from "@/types/mapTypes";
import allBuildingData from "./buildings_with_polygons.json";

function arrayToBuildingPolygon(polygon: number[][]) {
  const buildingPolygon: Polygon = polygon.map((coordinate) => {
    const position: Coordinate = {
      latitude: coordinate[1],
      longitude: coordinate[0],
    };
    return position;
  });
  return buildingPolygon;
}

export const CAMPUS_LOCATIONS: Campus = allBuildingData.map((buildingInfo) => {
  const maybeBuildings = buildingInfo.buildings;
  const location: Coordinate = {
    latitude: buildingInfo.geometry.location.lat,
    longitude: buildingInfo.geometry.location.lng,
  };

  if (!maybeBuildings) {
    console.log(buildingInfo.buildingCode);
    return {
      code: buildingInfo.buildingCode,
      type: "point",
      location,
    };
  }

  const isPolygon =
    maybeBuildings[0].building_outlines[0].display_polygon.type === "Polygon";
  const multipleCoordinates =
    maybeBuildings[0].building_outlines[0].display_polygon.coordinates;

  const buildingPolygons: Polygon[] = [];
  multipleCoordinates.forEach((buildingsCoordinates) => {
    if (isPolygon) {
      const oneBuildingCoordinates = buildingsCoordinates as number[][];
      const polygon = arrayToBuildingPolygon(oneBuildingCoordinates);
      buildingPolygons.push(polygon);
    } else {
      const manyBuildings = buildingsCoordinates as number[][][];
      manyBuildings.forEach((buildingCoordinates) => {
        const polygon = arrayToBuildingPolygon(buildingCoordinates);
        buildingPolygons.push(polygon);
      });
    }
  });

  const building: Building = {
    code: buildingInfo.buildingCode,
    type: "polygon",
    polygons: buildingPolygons,
    location,
  };
  return building;
});
