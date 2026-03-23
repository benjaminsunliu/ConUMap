import * as fs from 'node:fs';
import * as path from 'node:path';

const buildingFile = "H/jsonData/Hv4.json";
const absoluteJsonPath = path.resolve('../data/buildings/floors', buildingFile);

async function updateJsonInPlace() {
  try {
    if (!fs.existsSync(absoluteJsonPath)) {
      console.error(`Error: File not found at ${absoluteJsonPath}`);
      process.exit(1);
    }
    const rawData = fs.readFileSync(absoluteJsonPath, 'utf8');
    const data = JSON.parse(rawData);
    const doorwayLabels = [
      ...new Set(
        data.nodes
          .filter((n: any) => n.type === 'doorway' && n.label)
          .map((n: any) => n.label)
      )
    ];
    data.rooms = doorwayLabels;
    fs.writeFileSync(absoluteJsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Success: Updated ${buildingFile}`);
    console.log(`Added ${doorwayLabels.length} unique labels to the "rooms" key.`);

  } catch (error) {
    console.error("Error updating JSON:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

await updateJsonInPlace();