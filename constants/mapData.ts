import { Building, BuildingPolygon, Campus, Coordinate } from "@/types/map";
import buildingData from "./buildings_with_polygons.json";

function arrayToBuildingPolygon(polygon: number[][]) {
  const buildingPolygon: BuildingPolygon = polygon.map((coordinate) => {
    const position: Coordinate = {
      latitude: coordinate[1],
      longitude: coordinate[0],
    };
    return position;
  });
  return buildingPolygon;
}

export const CAMPUS_LOCATIONS: Campus = buildingData.map((buildingInfo) => {
  const maybeBuildings = buildingInfo.buildings;
  if (!maybeBuildings) {
    const location = buildingInfo.geometry.location;
    return {
      code: buildingInfo.buildingCode,
      type: "point",
      location: { latitude: location.lat, longitude: location.lng },
    };
  }

  const isPolygon =
    maybeBuildings[0].building_outlines[0].display_polygon.type === "Polygon";
  const multipleCoordinates =
    maybeBuildings[0].building_outlines[0].display_polygon.coordinates;
  console.log("an actual real building");
  console.log(buildingInfo.buildingCode);

  const buildingPolygons: BuildingPolygon[] = [];
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
    polygon: buildingPolygons,
  };
  return building;
});
