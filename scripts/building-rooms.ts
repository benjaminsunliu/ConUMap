import * as fs from 'node:fs';
import * as path from 'node:path';

const buildingFile = "H/jsonData/H.json";
const absoluteJsonPath = path.resolve('../data/buildings/floors', buildingFile);

interface BuildingNode {
  buildingId: string;
  label: string;
  type: string;
  [key: string]: any;
}

function getBuildingFormatConfig(buildingId: string) {
  return { isSpecial: ['H'].includes(buildingId) };
}

function formatLabel(node: BuildingNode): string {
  const { label, buildingId } = node;
  if (!label) return '';

  const parts = label.split(/[- ]/).filter(Boolean);
  const { isSpecial } = getBuildingFormatConfig(buildingId);

  if (isSpecial) {
    if (parts.length === 1) return parts[0];
    const [bId, room, ...sub] = parts;
    const suffix = sub.length ? `.${sub.join('.')}` : '';
    return `${bId}${room}${suffix}`;
  }

  if (parts.length < 2) return label;
  const [bId, floor, ...rest] = parts;
  const suffix = rest.length ? `.${rest.join('.')}` : '';
  return `${bId} ${floor}${suffix}`;
}

async function updateJsonInPlace() {
  try {
    if (!fs.existsSync(absoluteJsonPath)) {
      console.error(`Error: File not found at ${absoluteJsonPath}`);
      process.exit(1);
    }
    const rawData = fs.readFileSync(absoluteJsonPath, 'utf8');
    const data = JSON.parse(rawData);
    const doorwayLabels = ([
      ...new Set(
        data.nodes
          .filter((n: any) => n.type === 'doorway' && n.label)
          .map((n: any) => formatLabel(n as BuildingNode))
      )
    ] as string[]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    data.rooms = doorwayLabels;
    fs.writeFileSync(absoluteJsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Success: Updated ${buildingFile}`);
    console.log(`Added ${doorwayLabels.length} sorted unique labels to the "rooms" key.`);

  } catch (error) {
    console.error("Error updating JSON:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

await updateJsonInPlace();