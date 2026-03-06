import { BuildingInfo, Coordinate, Polygon } from "@/types/mapTypes";
import buildingMetaData from "@/data/building-meta-data.json";
import buildingGoogleData from "@/data/buildings-polygons.json";
import fs from "fs";

const OUTPUT_PATH = "data/buildings/";

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

type SingleGoogleData = (typeof buildingGoogleData)[number];

function extractGoogleData(buildingData: SingleGoogleData) {
  const display_polygon = buildingData.buildings[0].building_outlines[0].display_polygon;
  const location: Coordinate = {
    latitude: buildingData.geometry.location.lat,
    longitude: buildingData.geometry.location.lng,
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
  return {
    code: buildingData.buildingCode,
    polygons: buildingPolygons,
    location,
  };
}

function getMetaDataFromBuildingCode(code: string) {
  const metaData = buildingMetaData.find((dataPoint) => {
    if (dataPoint.buildingCode === code) {
      return true;
    }
    return false;
  });
  if (!metaData) {
    console.log("Couldn't find this building...");
    process.exit(1);
  }
  return metaData;
}

function mergeMetaDataAndGoogleData() {
  return buildingGoogleData.map((googleData) => {
    const extractedGoogleData = extractGoogleData(googleData);
    const metaData = getMetaDataFromBuildingCode(extractedGoogleData.code);
    const building: BuildingInfo = {
      polygons: extractedGoogleData.polygons,
      location: extractedGoogleData.location,
      buildingCode: extractedGoogleData.code,
      buildingName: metaData.buildingName,
      overview: metaData.overview,
      services: metaData.services || undefined,
      departments: metaData.departments || undefined,
      venues: metaData.venues || undefined,
      accessibility: metaData.accessibility,
      address: metaData.address,
      campus: metaData.campus,
      url: metaData.url,
    };
    return building;
  });
}

function writeBuildingsToFile() {
  const buildings = mergeMetaDataAndGoogleData();
  buildings.forEach((building) => {
    const fileName = `${OUTPUT_PATH}${building.buildingCode}.json`;
    const json = JSON.stringify(building, null, 2);
    fs.writeFileSync(fileName, json);
  });
}

writeBuildingsToFile();
