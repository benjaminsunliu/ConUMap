import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.resolve(__dirname, "../data/indoorMapData/jsonGraphs");

interface BuildingNode {
  buildingId: string;
  label: string;
  type: string;
  [key: string]: any;
}

function getBuildingFormatConfig(buildingId: string) {
  return { isSpecial: ["H"].includes(buildingId) };
}

function formatLabel(node: BuildingNode): string {
  const { label, buildingId } = node;
  if (!label) return "";

  const parts = label.split(/[- ]/).filter(Boolean);
  const { isSpecial } = getBuildingFormatConfig(buildingId);

  if (isSpecial) {
    if (parts.length === 1) return parts[0];
    const [bId, room, ...sub] = parts;
    const suffix = sub.length ? `.${sub.join(".")}` : "";
    return `${bId}${room}${suffix}`;
  }

  if (parts.length < 2) return label;
  const [bId, floor, ...rest] = parts;
  const suffix = rest.length ? `.${rest.join(".")}` : "";
  return `${bId} ${floor}${suffix}`;
}

function processFile(filePath: string) {
  try {
    const rawData = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(rawData);
    if (!data.nodes || !Array.isArray(data.nodes)) return;

    const doorwayLabels = (
      [
        ...new Set(
          data.nodes
            .filter((n: any) => n.type === "doorway" && n.label)
            .map((n: any) => formatLabel(n as BuildingNode)),
        ),
      ] as string[]
    ).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );

    data.rooms = doorwayLabels;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`Updated: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(
      `Error in ${filePath}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

async function runBatchUpdate() {
  if (!fs.existsSync(targetDir)) {
    console.error(`Directory not found: ${targetDir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith(".json.txt"));
  files.forEach((file) => processFile(path.join(targetDir, file)));
  console.log(`Processed ${files.length} files.`);
}

await runBatchUpdate();
