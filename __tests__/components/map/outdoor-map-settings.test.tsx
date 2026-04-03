import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import OutdoorMapSettings from "@/components/map/outdoor-map-settings";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

jest.mock("@react-native-community/slider", () => {
  const { View } = require("react-native");
  return View;
});

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/constants/theme", () => ({
  Colors: {
    light: {
      mapSettings: {
        fabBackground: "#fff",
        fabIcon: "#000",
        panelBackground: "#fff",
        title: "#000",
        icon: "#000",
        text: "#000",
        divider: "#eee",
        toggleTrue: "#00f",
        toggleFalse: "#ccc",
        checkbox: "#00f",
        backdropColor: "rgba(0,0,0,0.5)",
      },
    },
    dark: {
      mapSettings: {
        fabBackground: "#000",
        fabIcon: "#fff",
        panelBackground: "#000",
        title: "#fff",
        icon: "#fff",
        text: "#fff",
        divider: "#444",
        toggleTrue: "#00f",
        toggleFalse: "#666",
        checkbox: "#00f",
        backdropColor: "rgba(0,0,0,0.5)",
      },
    },
  },
}));

describe("OutdoorMapSettings", () => {
  const mockSetRadius = jest.fn();
  const mockSetPoiFilters = jest.fn();

  const defaultProps = {
    radius: 1000,
    setRadius: mockSetRadius,
    poiFilters: {
      restaurant: true,
      cafe: true,
      library: true,
      gym: true,
      park: true,
      shopping_mall: true,
      supermarket: true,
    },
    setPoiFilters: mockSetPoiFilters,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders only the FAB initially", () => {
    const { getByText, queryByText } = render(<OutdoorMapSettings {...defaultProps} />);

    expect(getByText("POIs")).toBeTruthy();
    expect(queryByText("POI Settings")).toBeNull();
  });

  it("opens the settings panel when the FAB is pressed", () => {
    const { getByTestId, getByText } = render(<OutdoorMapSettings {...defaultProps} />);

    fireEvent.press(getByTestId("outdoor-settings-button"));

    expect(getByText("POI Settings")).toBeTruthy();
    expect(getByText("POI Types")).toBeTruthy();
  });

  it("updates the radius when slider interaction completes", () => {
    const { getByTestId, getByText } = render(<OutdoorMapSettings {...defaultProps} />);

    fireEvent.press(getByTestId("outdoor-settings-button"));
    fireEvent(getByTestId("radius-slider"), "onSlidingComplete", 760);

    expect(mockSetRadius).toHaveBeenCalledWith(760);
    expect(getByText("760 m")).toBeTruthy();
  });

  it("toggles a POI filter when a row is pressed", () => {
    const { getByTestId, getByText } = render(<OutdoorMapSettings {...defaultProps} />);

    fireEvent.press(getByTestId("outdoor-settings-button"));
    fireEvent.press(getByText("Cafes"));

    expect(mockSetPoiFilters).toHaveBeenCalledWith({
      ...defaultProps.poiFilters,
      cafe: false,
    });
  });

  it("hides itself when a popup is visible", () => {
    const { queryByTestId } = render(
      <OutdoorMapSettings {...defaultProps} hasVisiblePopup />,
    );

    expect(queryByTestId("outdoor-settings-button")).toBeNull();
  });

  it("hides itself when the search field is focused", () => {
    const { queryByTestId } = render(
      <OutdoorMapSettings {...defaultProps} searchFieldFocused />,
    );

    expect(queryByTestId("outdoor-settings-button")).toBeNull();
  });
});
