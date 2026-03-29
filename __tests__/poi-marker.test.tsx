import React from "react";
import { render } from "@testing-library/react-native";
import PoiMarker from "../components/map/poi-marker";
import { PoiMarkerColors } from "@/constants/theme";
import { POI } from "@/types/mapTypes";

jest.mock("react-native-maps", () => {
  const { View } = require("react-native");

  return {
    Marker: ({ children, ...props }: any) => (
      <View testID="poi-marker-root" {...props}>
        {children}
      </View>
    ),
  };
});

jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");

  return {
    Ionicons: ({ ...props }: any) => <View testID="poi-icon" {...props} />,
  };
});

function makePoi(types: string[]): POI {
  return {
    place_id: "poi-1",
    name: "Test POI",
    types,
    geometry: {
      location: {
        lat: 45.495,
        lng: -73.579,
      },
      viewport: {
        northeast: { lat: 45.496, lng: -73.578 },
        southwest: { lat: 45.494, lng: -73.58 },
      },
    },
  };
}

describe("poi-marker", () => {
  it("renders marker with the POI coordinate", () => {
    const poi = makePoi(["restaurant"]);
    const { getByTestId } = render(<PoiMarker poi={poi} />);

    expect(getByTestId("poi-marker-root").props.coordinate).toEqual({
      latitude: 45.495,
      longitude: -73.579,
    });
  });

  it.each([
    {
      label: "restaurant",
      types: ["restaurant", "food"],
      expectedIcon: "restaurant",
      expectedColor: PoiMarkerColors.restaurant,
    },
    {
      label: "cafe",
      types: ["cafe"],
      expectedIcon: "cafe",
      expectedColor: PoiMarkerColors.cafe,
    },
    {
      label: "library",
      types: ["library"],
      expectedIcon: "library",
      expectedColor: PoiMarkerColors.library,
    },
    {
      label: "gym",
      types: ["gym"],
      expectedIcon: "barbell",
      expectedColor: PoiMarkerColors.gym,
    },
    {
      label: "park",
      types: ["park"],
      expectedIcon: "leaf",
      expectedColor: PoiMarkerColors.park,
    },
    {
      label: "shopping_mall",
      types: ["shopping_mall"],
      expectedIcon: "bag-handle",
      expectedColor: PoiMarkerColors.shopping,
    },
    {
      label: "store",
      types: ["store"],
      expectedIcon: "bag-handle",
      expectedColor: PoiMarkerColors.shopping,
    },
    {
      label: "supermarket",
      types: ["supermarket"],
      expectedIcon: "cart",
      expectedColor: PoiMarkerColors.supermarket,
    },
    {
      label: "lodging",
      types: ["lodging"],
      expectedIcon: "bed",
      expectedColor: PoiMarkerColors.lodging,
    },
    {
      label: "fallback",
      types: ["unknown_type"],
      expectedIcon: "location",
      expectedColor: PoiMarkerColors.default,
    },
  ])(
    "uses correct icon and color for $label",
    ({ types, expectedIcon, expectedColor }) => {
      const poi = makePoi(types);
      const { getByTestId } = render(<PoiMarker poi={poi} />);

      const icon = getByTestId("poi-icon");
      expect(icon.props.name).toBe(expectedIcon);
      expect(icon.props.color).toBe(PoiMarkerColors.icon);

      const markerBody = getByTestId("poi-marker-body");
      expect(markerBody.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: expectedColor }),
        ]),
      );
    },
  );
});
