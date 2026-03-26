import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import MapSettings from "@/components/map/indoor-map-settings";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
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
      },
    },
  },
}));

describe("MapSettings Component", () => {
  const defaultProps = {
    wheelchairOnly: false,
    setWheelchairOnly: jest.fn(),
    poiFilters: {
      bathrooms: true,
      elevators: false,
      washrooms: true,
    },
    setPoiFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render only the FAB initially", () => {
    const { queryByText } = render(<MapSettings {...defaultProps} />);
    expect(queryByText("Settings")).toBeNull();
  });

  it("should open the settings panel when the FAB is pressed", () => {
    const { getByText } = render(<MapSettings {...defaultProps} />);

    const icon = getByText("settings-outline");
    if (!icon.parent) throw new Error("FAB icon parent (TouchableOpacity) not found");

    fireEvent.press(icon.parent);

    expect(getByText("Settings")).toBeTruthy();
    expect(getByText("Points of Interest")).toBeTruthy();
  });

  it("should toggle the wheelchair accessibility switch", () => {
    const { getByText, getByRole } = render(<MapSettings {...defaultProps} />);

    const fabIcon = getByText("settings-outline");
    if (fabIcon.parent) fireEvent.press(fabIcon.parent);

    const switchComponent = getByRole("switch");

    fireEvent(switchComponent, "onValueChange", true);

    expect(defaultProps.setWheelchairOnly).toHaveBeenCalledWith(true);
  });

  it("should call setPoiFilters when a POI item is pressed", () => {
    const { getByText } = render(<MapSettings {...defaultProps} />);

    const fabIcon = getByText("settings-outline");
    if (fabIcon.parent) fireEvent.press(fabIcon.parent);

    const elevatorLabel = getByText("Elevators");
    if (!elevatorLabel.parent) throw new Error("Elevator row parent not found");

    fireEvent.press(elevatorLabel.parent);

    expect(defaultProps.setPoiFilters).toHaveBeenCalledWith({
      ...defaultProps.poiFilters,
      elevators: true,
    });
  });

  it("should toggle the panel closed when FAB is pressed twice", () => {
    const { getByText, queryByText } = render(<MapSettings {...defaultProps} />);

    const icon = getByText("settings-outline");
    if (!icon.parent) throw new Error("FAB icon parent not found");

    // Open
    fireEvent.press(icon.parent);
    expect(queryByText("Settings")).toBeTruthy();

    // Close
    fireEvent.press(icon.parent);
    expect(queryByText("Settings")).toBeNull();
  });

  it("should display the correct checkbox icon based on POI filter state", () => {
    const { getByText, getAllByText } = render(<MapSettings {...defaultProps} />);

    const icon = getByText("settings-outline");
    if (!icon.parent) throw new Error("FAB icon parent not found");
    fireEvent.press(icon.parent);

    const checkboxes = getAllByText("checkbox");

    expect(checkboxes.length).toBe(2);
    expect(getByText("square-outline")).toBeTruthy();
  });
});
