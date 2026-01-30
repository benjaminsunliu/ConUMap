export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type BuildingPolygon = Coordinate[];
export type Building =
  | {
      polygon: BuildingPolygon[];
      code: string;
      type: "polygon";
    }
  | {
      code: string;
      location: Coordinate;
      type: "point";
    };

export type Campus = Building[];
