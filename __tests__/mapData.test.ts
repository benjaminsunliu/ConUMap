import { arrayToBuildingPolygon } from "../constants/mapData";

test("arrayToBuildingPolygon works with integer coordinates", () => {
    let integerCoordinates = [
        [0, 0],
        [23, 84],
        [-100, 100]
    ];
    let buildingPolygon = arrayToBuildingPolygon(integerCoordinates);

    expect(buildingPolygon[0].longitude).toEqual(0);
    expect(buildingPolygon[0].latitude).toEqual(0);

    expect(buildingPolygon[1].longitude).toEqual(23);
    expect(buildingPolygon[1].latitude).toEqual(84);

    expect(buildingPolygon[1].longitude).toEqual(-100);
    expect(buildingPolygon[1].latitude).toEqual(-100);
});

test("arrayToBuildingPolygon works with float coordinates", () => {
    let floatCoordinates = [
        [-73.5795371416831, 45.4979631908601],
        [-73.5797038854998, 45.4977850408341],
        [-73.5796280890596, 45.49774788844],
        [-73.5794612989859, 45.4979205685552],
        [-73.5795371416831, 45.4979631908601]
    ]

    let buildingPolygon = arrayToBuildingPolygon(floatCoordinates);
    
    expect(buildingPolygon[0].longitude).toEqual(-73.5795371416831);
    expect(buildingPolygon[0].latitude).toEqual(45.4979631908601);

    expect(buildingPolygon[1].longitude).toEqual(-73.5797038854998);
    expect(buildingPolygon[1].latitude).toEqual(45.4977850408341);

    expect(buildingPolygon[2].longitude).toEqual(-73.5796280890596);
    expect(buildingPolygon[2].latitude).toEqual(45.49774788844);

    expect(buildingPolygon[3].longitude).toEqual(-73.5794612989859);
    expect(buildingPolygon[3].latitude).toEqual(45.4979205685552);

    expect(buildingPolygon[4].longitude).toEqual(-73.5795371416831);
    expect(buildingPolygon[4].latitude).toEqual(45.4979631908601);
})

// test("arrayToBuildingPolygon throws on invalid input", () => {
//     let invalidCoordinates = [
//         [-73.5795371416831, 45.4979631908601],
//         ["Montreal", false]
//     ];
    
//     expect(() => arrayToBuildingPolygon(invalidCoordinates)).toThrow();
// });