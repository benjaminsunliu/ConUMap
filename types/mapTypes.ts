export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Polygon = Coordinate[];

export type Building =
  | {
      polygons: Polygon[];
      code: string;
      type: "polygon";
      location: Coordinate;
    }
  | {
      code: string;
      location: Coordinate;
      type: "point";
    };

export type Campus = Building[];
