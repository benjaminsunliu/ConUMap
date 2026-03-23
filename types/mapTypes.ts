import { ImageRequireSource } from "react-native";
export type Campus = "SGW" | "LOY";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Polygon = Coordinate[];

type RelatedInfo = {
  name: string;
  url: string;
};

export type BuildingInfo = {
  polygons: Polygon[];
  location: Coordinate;
  buildingCode: string;
  buildingName: string;
  overview: string[];
  services?: RelatedInfo[];
  departments?: RelatedInfo[];
  venues?: RelatedInfo[];
  accessibility: string[];
  address: string;
  campus: string;
  url: string;
};

export type BuildingCode = BuildingInfo["buildingCode"];

export type CoordinateDelta = {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type Region = Coordinate & CoordinateDelta;

// ---- Information about floors and graphs of said floors

export type BuildingFloorInfo = {
  images: FloorImages;
  graphData: FloorCheckpointsGraph;
  buildingCode: BuildingCode;
};

export type RawFloorGraph = {
  meta: {
    buildingId: string;
  };
  nodes: FloorCheckpoint[];
  edges: FloorCheckpointConnection[];
};

export type FloorCheckpointsGraph = {
  checkpoints: FloorCheckpoints;
  adjacencySet: FloorCheckpointAdjancencySet;
};

export type FloorCheckpointAdjancencySet = {
  [key: FloorCheckpointId]: { [key: FloorCheckpointId]: FloorCheckpointConnection };
};

type FloorCheckpoints = {
  [key: FloorCheckpointId]: FloorCheckpoint;
};

export type FloorCheckpoint = {
  id: string;
  type: string;
  buildingId: string;
  floor: number;
  x: number;
  y: number;
  label?: string;
  accessible: boolean;
};

export type FloorCheckpointId = FloorCheckpoint["id"];

export type FloorCheckpointConnection = {
  source: FloorCheckpointId;
  target: FloorCheckpointId;
  type: string;
  weight: number;
  accessible: boolean;
};

export type FloorImages = {
  [key: number]: ImageRequireSource;
};

export type IndoorNavigationPath = FloorCheckpointId[];
