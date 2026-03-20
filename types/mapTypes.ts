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

export type CoordinateDelta = {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type Region = Coordinate & CoordinateDelta;
