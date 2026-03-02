export interface SearchBuilding {
    buildingCode: string;
    buildingName: string;
    address: string;
    campus: string;
}

export type FieldType = "start" | "end";

export type TransportationMode = "walking" | "transit" | "driving" | "bicycling" | "shuttle";