import { Polygon } from "@/types/mapTypes";
import buildingPolygons from "@/data/buildings-polygons.json";

const toLatLngRing = (ring: number[][]): Polygon =>
	ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));

// Gets building polygons when given the building's code.
export const getBuildingPolygons = (
	buildingCode: string,
	source: any[] = buildingPolygons as any[]
): Polygon[] => {
	const building = source.find((entry) => entry?.buildingCode === buildingCode);
	if (!building?.buildings) return [];

	return building.buildings.flatMap((entry: any) => {
		const outlines = entry?.building_outlines ?? [];
		return outlines.flatMap((outline: any) => {
			const displayPolygon = outline?.display_polygon;
			if (!displayPolygon?.coordinates) return [];
			if (displayPolygon.type === "MultiPolygon") {
				return displayPolygon.coordinates.flat().map(toLatLngRing);
			}
			return displayPolygon.coordinates.map(toLatLngRing);
		});
	});
};
