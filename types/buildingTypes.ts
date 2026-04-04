export interface SearchBuilding {
  buildingCode: string;
  buildingName: string;
  address: string;
  campus: string;
  parentBuildingCode?: string;
  roomName?: string;
  isIndoorRoom?: boolean;
}

export type FieldType = "start" | "end";

export type TransportationMode =
  | "walking"
  | "transit"
  | "driving"
  | "bicycling"
  | "shuttle";
