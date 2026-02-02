import csvParser from "csv-parser";
import fs, { access } from "fs";

type Campus = "SGW" | "LOY";

type CampusBuildingInfo = {
  name: Campus;
  buildings: BuildingInfoRowData[];
};

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
  buildingCode: string;
  buildingName: string;
  link: string;
  address: string;
  overview: string[];
  accessibility: string[] | null;
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
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => arr.push(preprocessor(data)))
      .on("end", () => resolve(arr))
      .on("error", (err) => reject(err));
  });
}

const campusNames: Campus[] = ["SGW", "LOY"];
const linksFilePath: string = `./data/Concordia Buildings - Links.csv`;
const resources = await parseCSV<ConcordiaWebsiteResource>(linksFilePath);

function getResources(data: string): ConcordiaWebsiteResource[] | null {
  if (data.length == 0) return null;
  return data.split("\n").flatMap((name) => {
    name = name.replaceAll("\n", "");
    const found = resources.find((r) => r.name === name);
    return found ? [found] : [];
  });
}
enum AccessbilityOptions {
  entranceRamp = "This building entrance is equipped with an accessibility ramp",
  entranceAutomatedDoor = "This building has an automated accessible entrance door",
  elevator = "This building entrance is equipped with an accessible elevator",
  wheelchairLift = "This building is equipped with a wheelchair lift",
  none = "It is not equipped with an accessibility ramp, automated door, elevator or wheelchair lift",
  outdoor = "This outdoor space is partially accessible around its perimeter",
  groundFloor = "The ground floor of this building is wheelchair accessible, including the individual-use washroom",
}

type AccessKey = keyof typeof AccessbilityOptions;

const reverseAccessMap: Record<string, AccessKey> = Object.entries(
  AccessbilityOptions,
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
  const buildings = await parseCSV<BuildingInfoRowData, BuildingInfo>(filePath, (el) => {
    return {
      ...el,
      overview: el.overview
        .split("\n")
        .map((line) => line.replace(/\r/g, "").trim())
        .filter((line) => line.length > 0),
      services: getResources(el.services),
      departments: getResources(el.departments),
      venues: getResources(el.venues),
      accessibility: getAccessibility(el.accessibility),
    };
  });
  return {
    name: campus,
    buildings: buildings,
  };
}

async function runAndSave() {
  console.log("🔄 Starting parsing process...");

  // 1. Fetch data for all campuses
  const campusResults = await Promise.all(
    campusNames.map(async (campus) => {
      const data = await getBuildingsForCampus(campus);
      return [campus, data.buildings]; // Return a pair for Object.fromEntries
    }),
  );

  // 2. Format into { "SGW": [...], "LOY": [...] }
  const finalResult = Object.fromEntries(campusResults);

  // 3. Define file metadata
  const filePath = "./data/parsedBuildings.ts";
  const variableName = "concordiaCampusData";

  // 4. Construct the file content
  const fileContent = `/**
 * Automatically generated Building Data
 * Generated on: ${new Date().toLocaleString()}
 */

export const ${variableName} = ${JSON.stringify(finalResult, null, 2)} as const;

export type BuildingDataMap = typeof ${variableName};
`.trim();

  // 5. Write to disk
  try {
    fs.writeFileSync(filePath, fileContent, "utf8");
    console.log(`✅ Success! Data saved to ${filePath}`);

    // Quick Debug log to verify structure
    const keys = Object.keys(finalResult);
    console.log(`Mapped campuses: ${keys.join(", ")}`);
  } catch (error) {
    console.error("❌ Error saving file:", error);
  }
}

// Execute the process
runAndSave();
