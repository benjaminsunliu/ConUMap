import { ImageSourcePropType } from "react-native";

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

export type BuildingFloorInfo = {
  imageURI: ImageSourcePropType;
  graphData: FloorCheckpointsGraph;
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

type FloorCheckpointAdjancencySet = {
  [key: FloorCheckpointId]: { [key: FloorCheckpointId]: FloorCheckpointConnection };
};

type FloorCheckpoints = {
  [key: FloorCheckpointId]: FloorCheckpoint;
};

type FloorCheckpoint = {
  id: string;
  type: string;
  buildingId: string;
  floor: number;
  x: number;
  y: number;
  label?: string;
  accessible: boolean;
};

type FloorCheckpointId = FloorCheckpoint["id"];

type FloorCheckpointConnection = {
  source: FloorCheckpointId;
  target: FloorCheckpointId;
  type: string;
  weight: number;
  accessible: boolean;
};
