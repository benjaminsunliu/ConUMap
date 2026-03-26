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

export interface POI {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];

  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };

  opening_hours?: {
    open_now: boolean;
  };

  photos?: {
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }[];
}
