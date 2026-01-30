import fs from "fs";
import buildingInfo from "./building-addresses.json";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const OUTPUT_FILE_NAME = "constants/buildings_with_polygons.json";

type Coordinates = [number, number][];

// APROXIMATE: do not use as real type
type Building = {
  building_outlines: [
    {
      display_polygon: {
        coordinates: Coordinates[];
        type: "Polygon";
      };
    },
  ];
  place_id: string;
};

type APIResponse = {
  results: {
    buildings: Building[];
    address_components?: object[];
  }[];
};

async function fetchBuildingPolygon(address: string) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&extra_computations=BUILDING_AND_ENTRANCES&key=${GOOGLE_API_KEY}`;
  const data = (await (await fetch(url)).json()) as APIResponse;
  return data;
}

async function main() {
  const addressesWithPolygons = buildingInfo.map(async (info) => {
    const result = (await fetchBuildingPolygon(info.address)).results[0];
    delete result["address_components"];
    Object.assign(result, info);
    return result;
  });
  const outputData = await Promise.all(addressesWithPolygons);
  const asJson = JSON.stringify(outputData, null, 2);
  fs.writeFileSync(OUTPUT_FILE_NAME, asJson);
}

main();
