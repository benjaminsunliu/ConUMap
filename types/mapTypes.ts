export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Polygon = Coordinate[];

export type Building = {
  polygons: Polygon[];
  code: string;
  location: Coordinate;
};

export type Campus = Building[];
