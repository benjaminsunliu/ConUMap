import { getBuildingPolygons } from "@/utils/getBuildingPolygons";
import { Polygon } from "@/types/mapTypes";

describe("getBuildingPolygons", () => {
	// Mock data representing different scenarios
	const mockDataSource = [
		{
			buildingCode: "H",
			buildings: [
				{
					building_outlines: [
						{
							display_polygon: {
								type: "Polygon",
								coordinates: [
									[
										[-73.5789, 45.4972],
										[-73.5785, 45.4972],
										[-73.5785, 45.4975],
										[-73.5789, 45.4975],
										[-73.5789, 45.4972],
									],
								],
							},
						},
					],
				},
			],
		},
		{
			buildingCode: "MB",
			buildings: [
				{
					building_outlines: [
						{
							display_polygon: {
								type: "MultiPolygon",
								coordinates: [
									[
										[
											[-73.579, 45.4973],
											[-73.5786, 45.4973],
											[-73.5786, 45.4976],
											[-73.579, 45.4976],
											[-73.579, 45.4973],
										],
									],
									[
										[
											[-73.5792, 45.4978],
											[-73.5788, 45.4978],
											[-73.5788, 45.4981],
											[-73.5792, 45.4981],
											[-73.5792, 45.4978],
										],
									],
								],
							},
						},
					],
				},
			],
		},
		{
			buildingCode: "EMPTY_BUILDINGS",
			buildings: [],
		},
		{
			buildingCode: "NO_OUTLINES",
			buildings: [
				{
					building_outlines: [],
				},
			],
		},
		{
			buildingCode: "NO_COORDINATES",
			buildings: [
				{
					building_outlines: [
						{
							display_polygon: {
								type: "Polygon",
								coordinates: null,
							},
						},
					],
				},
			],
		},
		{
			buildingCode: "NO_DISPLAY_POLYGON",
			buildings: [
				{
					building_outlines: [
						{
							display_polygon: null,
						},
					],
				},
			],
		},
		{
			buildingCode: "MULTIPLE_OUTLINES",
			buildings: [
				{
					building_outlines: [
						{
							display_polygon: {
								type: "Polygon",
								coordinates: [
									[
										[-73.58, 45.498],
										[-73.579, 45.498],
										[-73.579, 45.499],
										[-73.58, 45.499],
										[-73.58, 45.498],
									],
								],
							},
						},
						{
							display_polygon: {
								type: "Polygon",
								coordinates: [
									[
										[-73.581, 45.499],
										[-73.58, 45.499],
										[-73.58, 45.5],
										[-73.581, 45.5],
										[-73.581, 45.499],
									],
								],
							},
						},
					],
				},
			],
		},
	];

	describe("Valid building codes", () => {
		it("should return polygon coordinates for a valid building code with Polygon type", () => {
			const result = getBuildingPolygons("H", mockDataSource);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(5);
			expect(result[0][0]).toEqual({ latitude: 45.4972, longitude: -73.5789 });
			expect(result[0][1]).toEqual({ latitude: 45.4972, longitude: -73.5785 });
		});

		it("should return multiple polygons for a building with MultiPolygon type", () => {
			const result = getBuildingPolygons("MB", mockDataSource);

			expect(result).toHaveLength(2);
			expect(result[0]).toHaveLength(5);
			expect(result[1]).toHaveLength(5);
			expect(result[0][0]).toEqual({ latitude: 45.4973, longitude: -73.579 });
			expect(result[1][0]).toEqual({ latitude: 45.4978, longitude: -73.5792 });
		});

		it("should handle buildings with multiple outlines", () => {
			const result = getBuildingPolygons("MULTIPLE_OUTLINES", mockDataSource);

			expect(result).toHaveLength(2);
			expect(result[0]).toHaveLength(5);
			expect(result[1]).toHaveLength(5);
		});

		it("should correctly transform coordinates from [lng, lat] to {latitude, longitude}", () => {
			const result = getBuildingPolygons("H", mockDataSource);

			// Verify the transformation is correct (lng, lat -> {latitude, longitude})
			result[0].forEach((coord) => {
				expect(coord).toHaveProperty("latitude");
				expect(coord).toHaveProperty("longitude");
				expect(typeof coord.latitude).toBe("number");
				expect(typeof coord.longitude).toBe("number");
			});
		});
	});

	describe("Invalid building codes", () => {
		it("should return an empty array for a non-existent building code", () => {
			const result = getBuildingPolygons("INVALID_CODE", mockDataSource);

			expect(result).toEqual([]);
		});

		it("should return an empty array for an empty string building code", () => {
			const result = getBuildingPolygons("", mockDataSource);

			expect(result).toEqual([]);
		});
	});

	describe("Edge cases", () => {
		it("should return an empty array when building has no buildings property", () => {
			const dataWithNoBuildingsProperty = [
				{
					buildingCode: "TEST",
				},
			];

			const result = getBuildingPolygons("TEST", dataWithNoBuildingsProperty);

			expect(result).toEqual([]);
		});

		it("should return an empty array when building has null buildings property", () => {
			const dataWithNullBuildings = [
				{
					buildingCode: "TEST",
					buildings: null,
				},
			];

			const result = getBuildingPolygons("TEST", dataWithNullBuildings);

			expect(result).toEqual([]);
		});

		it("should return an empty array when buildings array is empty", () => {
			const result = getBuildingPolygons("EMPTY_BUILDINGS", mockDataSource);

			expect(result).toEqual([]);
		});

		it("should return an empty array when building has no outlines", () => {
			const result = getBuildingPolygons("NO_OUTLINES", mockDataSource);

			expect(result).toEqual([]);
		});

		it("should return an empty array when display_polygon has no coordinates", () => {
			const result = getBuildingPolygons("NO_COORDINATES", mockDataSource);

			expect(result).toEqual([]);
		});

		it("should return an empty array when display_polygon is null", () => {
			const result = getBuildingPolygons("NO_DISPLAY_POLYGON", mockDataSource);

			expect(result).toEqual([]);
		});

		it("should handle empty source array", () => {
			const result = getBuildingPolygons("H", []);

			expect(result).toEqual([]);
		});

		it("should use default buildingPolygons source when no source is provided", () => {
			// This test verifies that the function can be called without the source parameter
			// It will use the actual buildings-polygons.json file
			const result = getBuildingPolygons("INVALID_CODE");

			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("Data structure validation", () => {
		it("should handle buildings with undefined building_outlines gracefully", () => {
			const dataWithUndefinedOutlines = [
				{
					buildingCode: "TEST",
					buildings: [
						{
							building_outlines: undefined,
						},
					],
				},
			];

			const result = getBuildingPolygons("TEST", dataWithUndefinedOutlines);

			expect(result).toEqual([]);
		});

		it("should handle mixed valid and invalid outlines", () => {
			const mixedData = [
				{
					buildingCode: "MIXED",
					buildings: [
						{
							building_outlines: [
								{
									display_polygon: null,
								},
								{
									display_polygon: {
										type: "Polygon",
										coordinates: [
											[
												[-73.58, 45.498],
												[-73.579, 45.498],
												[-73.579, 45.499],
												[-73.58, 45.499],
												[-73.58, 45.498],
											],
										],
									},
								},
								{
									display_polygon: {
										type: "Polygon",
										coordinates: null,
									},
								},
							],
						},
					],
				},
			];

			const result = getBuildingPolygons("MIXED", mixedData);

			// Should only return the valid polygon
			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(5);
		});
	});

	describe("Return type validation", () => {
		it("should always return an array", () => {
			const result1 = getBuildingPolygons("H", mockDataSource);
			const result2 = getBuildingPolygons("INVALID", mockDataSource);
			const result3 = getBuildingPolygons("NO_OUTLINES", mockDataSource);

			expect(Array.isArray(result1)).toBe(true);
			expect(Array.isArray(result2)).toBe(true);
			expect(Array.isArray(result3)).toBe(true);
		});

		it("should return an array of polygons where each polygon is an array of coordinates", () => {
			const result = getBuildingPolygons("H", mockDataSource);

			expect(Array.isArray(result)).toBe(true);
			result.forEach((polygon: Polygon) => {
				expect(Array.isArray(polygon)).toBe(true);
				polygon.forEach((coord) => {
					expect(coord).toHaveProperty("latitude");
					expect(coord).toHaveProperty("longitude");
				});
			});
		});
	});
});
