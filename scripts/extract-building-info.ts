import csvParser from "csv-parser";
import fs from "fs";

type Campus = "SGW" | "LOY";

type ConcordiaWebsiteResource = {
  name: string;
  link: string;
};

type BuildingInfoRowData = {
  buildingCode: string;
  buildingName: string;
  link: string;
  address: string;
  latitude: string;
  longitude: string;
  overview: string;
  accessibility: string;
  services: string;
  departments: string;
  venues: string;
};

type BuildingInfo = {
  campus: Campus;
  buildingCode: string;
  buildingName: string;
  link: string;
  address: string;
  overview: string[];
  accessibility: string[];
  services: ConcordiaWebsiteResource[] | null;
  departments: ConcordiaWebsiteResource[] | null;
  venues: ConcordiaWebsiteResource[] | null;
};

function parseCSV<A, B>(filePath: string, preprocessor: (x: A) => B): Promise<B[]>;
function parseCSV<T>(filePath: string, preprocessor?: (x: T) => T): Promise<T[]>;

async function parseCSV<T>(
  filePath: string,
  preprocessor: (x: any) => T = (x) => x,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const arr: T[] = [];
    const readStream = fs.createReadStream(filePath);
    readStream.on("error", (err) => reject(err));
    readStream
      .pipe(csvParser())
      .on("data", (data) => arr.push(preprocessor(data)))
      .on("end", () => resolve(arr))
      .on("error", (err) => reject(err));
  });
}

const linksFilePath: string = `./data/Concordia Buildings - Links.csv`;

function getResources(
  data: string,
  resources: ConcordiaWebsiteResource[],
): ConcordiaWebsiteResource[] | null {
  if (data.length == 0) return null;
  return data.split("\n").flatMap((name) => {
    name = name.replaceAll("\n", "");
    const found = resources.find((r) => r.name === name);
    return found ? [found] : [];
  });
}

enum AccessibilityOptions {
  entranceRamp = "This building entrance is equipped with an accessibility ramp",
  entranceAutomatedDoor = "This building has an automated accessible entrance door",
  elevator = "This building entrance is equipped with an accessible elevator",
  wheelchairLift = "This building is equipped with a wheelchair lift",
  none = "It is not equipped with an accessibility ramp, automated door, elevator or wheelchair lift",
  outdoor = "This outdoor space is partially accessible around its perimeter",
  groundFloor = "The ground floor of this building is wheelchair accessible, including the individual-use washroom",
}

type AccessKey = keyof typeof AccessibilityOptions;

const reverseAccessMap: Record<string, AccessKey> = Object.entries(
  AccessibilityOptions,
).reduce(
  (acc, [key, value]) => {
    const normalizedValue = value.replace(/\.$/, "").trim();
    acc[normalizedValue] = key as AccessKey;
    return acc;
  },
  {} as Record<string, AccessKey>,
);

function getAccessibility(data: string): AccessKey[] {
  if (!data || data.trim().length === 0) return [];
  const lines = data.replaceAll("\r", "").split("\n");
  const foundKeys = new Set<AccessKey>();
  lines.forEach((line) => {
    const cleanLine = line.trim().replace(/\.$/, "");
    const key = reverseAccessMap[cleanLine];
    if (key && key !== "none") {
      foundKeys.add(key);
    }
  });
  return Array.from(foundKeys);
}

async function getBuildingsForCampus(campus: Campus) {
  const filePath: string = `./data/Concordia Buildings - ${campus}.csv`;
  const resources = await parseCSV<ConcordiaWebsiteResource>(linksFilePath);
  const buildings = await parseCSV<BuildingInfoRowData, BuildingInfo>(filePath, (el) => {
    return {
      campus: campus,
      buildingCode: el.buildingCode,
      buildingName: el.buildingName,
      link: el.link,
      address: el.address,
      overview: el.overview
        .split("\n")
        .map((line) => line.replace(/\r/g, "").trim())
        .filter((line) => line.length > 0),
      services: getResources(el.services, resources),
      departments: getResources(el.departments, resources),
      venues: getResources(el.venues, resources),
      accessibility: getAccessibility(el.accessibility),
    };
  });
  return buildings;
}

async function runAndSave() {
  const campusNames: Campus[] = ["SGW", "LOY"];

  const allBuildingsArrays = await Promise.all(campusNames.map(getBuildingsForCampus));
  const allBuildings = allBuildingsArrays.flat();

  const filePath = "./data/parsedBuildings.ts";
  const fileContent = `/**
 * Generated on: ${new Date().toLocaleString()}
 */

export const concordiaBuildings = ${JSON.stringify(allBuildings, null, 2)} as const;

export type BuildingInfo = typeof concordiaBuildings[number];
`.trim();

  try {
    fs.writeFileSync(filePath, fileContent, "utf8");
    console.log(`✅ Saved ${allBuildings.length} buildings to ${filePath}`);
  } catch (err) {
    console.error("❌ Save failed", err);
  }
}

async function main() {
  runAndSave();
}

main();
