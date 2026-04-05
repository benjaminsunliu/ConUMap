import fs from "fs";
import buildingInfo from "@/data/building-addresses.json";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const OUTPUT_FILE_NAME = "data/buildings-polygons.json";

type Building = {
  formatted_address: string;
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

async function fetchBuildingPolygon(address: string, place_id?: string) {
  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const identifier = place_id
    ? `place_id=${encodeURIComponent(place_id)}`
    : `address=${encodeURIComponent(address)}`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${identifier}&extra_computations=BUILDING_AND_ENTRANCES&key=${GOOGLE_API_KEY}`;
  const data = (await (await fetch(url)).json()) as APIResponse;
  return data;
}

function injectManualData(info: APIResponse["results"][number]) {
  const manualOverrides: {
    [key: string]: {
      polygon: [number, number][];
      location?: {
        lat: number;
        lng: number;
      };
    };
  } = {
    B: {
      polygon: [
        [-73.5794529416831, 45.4979339908601],
        [-73.5796196854998, 45.4977558408341],
        [-73.5795438890596, 45.49771868844],
        [-73.5793770989859, 45.4978913685552],
        [-73.5794529416831, 45.4979339908601],
      ],
      location: {
        lat: 45.4978133,
        lng: -73.5795029,
      },
    },
    D: {
      polygon: [
        [-73.5793010899212, 45.4978549227901],
        [-73.579550798021, 45.4975977522658],
        [-73.5794868952769, 45.49756781502],
        [-73.5794029715002, 45.4976564390671],
        [-73.579425779305, 45.4976673292006],
        [-73.5793546447476, 45.4977429255837],
        [-73.5793167222431, 45.4977250839333],
        [-73.5792279854624, 45.4978197907935],
        [-73.5793010899212, 45.4978549227901],
      ],
      location: {
        lat: 45.4977171,
        lng: -73.5793885,
      },
    },
    FG: {
      polygon: [
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
    },
    GM: {
      polygon: [
        [-73.57843045145273, 45.49594492001711],
        [-73.57874527573586, 45.495619423207835],
        [-73.57913788408041, 45.49577993919802],
        [-73.57880294322968, 45.49611836086987],
      ],
    },
    K: {
      polygon: [
        [-73.5793770989859, 45.4978913685552],
        [-73.5795513545586, 45.4977112249532],
        [-73.5794753494702, 45.4976758135195],
        [-73.5793009819464, 45.4978547592371],
        [-73.5793770989859, 45.4978913685552],
      ],
      location: {
        lat: 45.4977295,
        lng: -73.5794476,
      },
    },
    LS: {
      polygon: [
        [-73.57923712581396, 45.4963829863991],
        [-73.5795683786273, 45.49653409970922],
        [-73.57967834919691, 45.49641400813814],
        [-73.57958145439625, 45.496366535469946],
        [-73.57967030256987, 45.49626994491753],
        [-73.57944466173649, 45.49616254354915],
      ],
    },
    MI: {
      polygon: [
        [-73.5792574838473, 45.4976775257788],
        [-73.5791500402066, 45.4977824691037],
        [-73.5792279854624, 45.4978197907935],
        [-73.5793281189956, 45.4977130320955],
        [-73.5792574838473, 45.4976775257788],
      ],
      location: {
        lat: 45.4977489,
        lng: -73.5792401,
      },
    },
    MU: {
      // Google resolves MU to the B Annex footprint, so keep a manual row-house
      // outline and align it with the rest of the Bishop block.
      polygon: [
        [-73.5795287843803, 45.497976613165],
        [-73.579695528197, 45.497798463139],
        [-73.5796197317568, 45.4977613107449],
        [-73.5794529416831, 45.4979339908601],
        [-73.5795287843803, 45.497976613165],
      ],
      location: {
        lat: 45.4978559223049,
        lng: -73.5795787426972,
      },
    },
    PC: {
      polygon: [
        [-73.63698575645685, 45.456683256284016],
        [-73.63676983863115, 45.45694571528955],
        [-73.63762143999338, 45.457278490856524],
        [-73.63783199340105, 45.457017914819666],
      ],
    },
    RA: {
      polygon: [
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
    },
    SI: {
      polygon: [
        [-73.64255301654339, 45.458186969914046],
        [-73.64193610846996, 45.45793909745282],
        [-73.64237297326326, 45.45755317620534],
        [-73.64259626716375, 45.457626080482484],
        [-73.64252619445324, 45.45787936331917],
        [-73.64269752055407, 45.457954148563125],
      ],
    },
    CL: {
      polygon: [
        [-73.57927903532982, 45.49446736090339],
        [-73.5789367184043, 45.49426218699242],
        [-73.57903998345137, 45.494165592830484],
        [-73.57940107584, 45.49437711267723],
      ],
    },
    GS: {
      polygon: [
        [-73.580865226686, 45.49642458372708],
        [-73.5807941481471, 45.49652939945684],
        [-73.58135774731636, 45.496751015929185],
        [-73.58145363628864, 45.49660742359537],
      ],
    },
    DO: {
      polygon: [
        [-73.6352242, 45.4579249],
        [-73.6359626, 45.4583538],
        [-73.6370915, 45.4573846],
        [-73.6363623, 45.4569612],
        [-73.6352242, 45.4579249],
      ],
    },
  };
  const override = manualOverrides[info.buildingCode];
  if (override) {
    info.buildings = [
      {
        building_outlines: [
          {
            display_polygon: {
              coordinates: [override.polygon],
              type: "Polygon",
            },
          },
        ],
      },
    ];
    if (override.location) {
      info.geometry.location = override.location;
    }
  }
}

async function main() {
  const addressesWithPolygons = buildingInfo.map(async (info) => {
    const result = (await fetchBuildingPolygon(info.address, info.place_id)).results[0];
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
