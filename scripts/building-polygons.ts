import fs from "fs";
import buildingInfo from "./building-addresses.json";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const OUTPUT_FILE_NAME = "constants/buildings_with_polygons.json";

type Building = {
  formatted_address: "7200 Rue Sherbrooke O, Montréal, QC H4B 2A4, Canada";
  geometry: {
    bounds: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
    location: {
      lat: number;
      lng: number;
    };
    location_type: "GEOMETRIC_CENTER";
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  buildings: {
    building_outlines: {
      display_polygon: {
        coordinates: [[number, number][]];
        type: "Polygon" | "MultiPolygon";
      };
    }[];
    place_id?: string;
  }[];
  navigation_points: {
    location: {
      latitude: number;
      longitude: number;
    };
    restricted_travel_modes: string[];
  }[];
  place_id: string;
  types: string[];
  address_components?: object[];
};

type FromConcordia = {
  buildingCode: string;
  buildingName: string;
  address: string;
};

type APIResponse = {
  results: (Building & FromConcordia)[];
};

async function fetchBuildingPolygon(address: string) {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&extra_computations=BUILDING_AND_ENTRANCES&key=${GOOGLE_API_KEY}`;
  const data = (await (await fetch(url)).json()) as APIResponse;
  return data;
}

function injectManualData(info: APIResponse["results"][number]) {
  const missingData: { [key: string]: [number, number][] } = {
    FG: [
      [-73.5790675793437, 45.4938224310594],
      [-73.5787278267861, 45.4936253317537],
      [-73.578464404337, 45.4938485663982],
      [-73.5784404879638, 45.4938347082701],
      [-73.5783841887415, 45.4938823658608],
      [-73.5783999809559, 45.49389163144],
      [-73.578363117757, 45.4939229605407],
      [-73.5783422413871, 45.493910878984],
      [-73.5781141243649, 45.4941040322076],
      [-73.5781260965672, 45.4941111110426],
      [-73.5780171102815, 45.4942034157231],
      [-73.5779871135714, 45.4941860040851],
      [-73.577767934105, 45.4943716169905],
      [-73.5778036071554, 45.4943922272942],
      [-73.5777531697142, 45.4944351389261],
      [-73.5776941232604, 45.4944025217638],
      [-73.5776357197305, 45.4944086795991],
      [-73.5776003421639, 45.4944430329004],
      [-73.5780392058659, 45.4946956374377],
      [-73.5784295241273, 45.4943622108617],
      [-73.5784423565512, 45.4943695640644],
      [-73.5785228036446, 45.4943013994673],
      [-73.5785104552821, 45.4942942652392],
      [-73.5790675793437, 45.4938224310594],
    ],
    GM: [
      [-73.57843045145273, 45.49594492001711],
      [-73.57874527573586, 45.495619423207835],
      [-73.57913788408041, 45.49577993919802],
      [-73.57880294322968, 45.49611836086987],
    ],
    LS: [
      [-73.57923712581396, 45.4963829863991],
      [-73.5795683786273, 45.49653409970922],
      [-73.57967834919691, 45.49641400813814],
      [-73.57958145439625, 45.496366535469946],
      [-73.57967030256987, 45.49626994491753],
      [-73.57944466173649, 45.49616254354915],
    ],
    PC: [
      [-73.63698575645685, 45.456683256284016],
      [-73.63676983863115, 45.45694571528955],
      [-73.63762143999338, 45.457278490856524],
      [-73.63783199340105, 45.457017914819666],
    ],
    RA: [
      [-73.63709539175034, 45.45671477024348],
      [-73.63736227154732, 45.45639186891413],
      [-73.6381334066391, 45.45669007647078],
      [-73.63806366920471, 45.45679214399463],
      [-73.63818034529686, 45.456840355548806],
      [-73.63805025815964, 45.457004039347105],
      [-73.63792017102242, 45.45695488722195],
      [-73.63786485046148, 45.45702732191778],
      [-73.63709673285484, 45.45672088489029],
    ],
    SI: [
      [-73.64255301654339, 45.458186969914046],
      [-73.64193610846996, 45.45793909745282],
      [-73.64237297326326, 45.45755317620534],
      [-73.64259626716375, 45.457626080482484],
      [-73.64252619445324, 45.45787936331917],
      [-73.64269752055407, 45.457954148563125],
    ],
    CL: [
      [-73.57927903532982, 45.49446736090339],
      [-73.5789367184043, 45.49426218699242],
      [-73.57903998345137, 45.494165592830484],
      [-73.57940107584, 45.49437711267723],
    ],
    GS: [
      [-73.580865226686, 45.49642458372708],
      [-73.5807941481471, 45.49652939945684],
      [-73.58135774731636, 45.496751015929185],
      [-73.58145363628864, 45.49660742359537],
    ],
  };
  if (info.buildingCode in missingData) {
    info.buildings = [
      {
        building_outlines: [
          {
            display_polygon: {
              coordinates: [missingData[info.buildingCode]],
              type: "Polygon",
            },
          },
        ],
      },
    ];
  }
}

async function main() {
  const addressesWithPolygons = buildingInfo.map(async (info) => {
    const result = (await fetchBuildingPolygon(info.address)).results[0];
    delete result["address_components"];
    Object.assign(result, info);
    injectManualData(result);
    return result;
  });
  const outputData = await Promise.all(addressesWithPolygons);
  const asJson = JSON.stringify(outputData, null, 2);
  fs.writeFileSync(OUTPUT_FILE_NAME, asJson);
}

main();
