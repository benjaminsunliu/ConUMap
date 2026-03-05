import React from "react";
import { render, fireEvent } from '@testing-library/react-native';
import BuildingSelection from "@/components/map/building-selection";


const mockAnimateToRegion = jest.fn();

jest.mock('react-native-map-clustering', () => {
  const React = require("react");
  const { forwardRef, useImperativeHandle } = React;
  const { View } = require("react-native");
  const mockCluster = forwardRef((props: React.PropsWithChildren<any>, ref: any) => {
    useImperativeHandle(ref, () => ({
      animateToRegion: mockAnimateToRegion,
    }));
    return <View {...props}>{props.children}</View>;
  });
  mockCluster.displayName = "mockCluster";
  return {
    __esModule: true,
    default: mockCluster

  };
});

jest.mock('expo-location', () => ({
  hasServicesEnabledAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('react-native-maps', () => {
  const { View } = require("react-native");
  return {
    Marker: (props: any) => <View {...props} />,
    Polygon: (props: any) => <View testID="polygon" {...props} />,
  };
});

jest.mock("@/constants/map", () => {

  const { getBuildingPolygons } = require("@/utils/getBuildingPolygons");

  return {
    CAMPUS_BUILDINGS: [
      {
        code: "LB",
        location: { latitude: 45.495, longitude: -73.579 },
        polygons: getBuildingPolygons("LB"),
      },
      {
        code: "VE",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("VE"),
      },
      {
        code: "RA",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("RA"),
      },
      {
        code: "PC",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("PC"),
      },
      {
        code: "AB",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("AB"),
      },
    ],
  };
});

jest.mock("@/data/building-addresses.json", () => [
  {
    "buildingCode": "B",
    "buildingName": "B Annex",
    "address": "2160 Bishop St, Montreal, QC",
    "campus": "SGW"
  },
  {
    "buildingCode": "CI",
    "buildingName": "CI Annex",
    "address": "2149 Mackay St., Montreal, QC",
    "campus": "SGW"
  },
  {
    "buildingCode": "CL",
    "buildingName": "CL Annex",
    "address": "1665 Ste-Catherine St. W., Montreal, QC",
    "campus": "SGW"
  },
  {
    "buildingCode": "H",
    "buildingName": "Henry F. Hall Building",
    "address": "1455 Blvd. De Maisonneuve Ouest, Montreal, QC H3G 1M8",
    "campus": "SGW"
  }
]);

beforeEach(() => {
  mockAnimateToRegion.mockClear();
});

const mockOnSelect = jest.fn();

describe("BuildingSelection Browse", () => {
  it('should display the search bar, and no results', async () => {
    const selectionView = render(<BuildingSelection selectedBuilding={null} mode={"browse"} onSelect={mockOnSelect} />)
    const container = selectionView.getByTestId('building-selection');
    expect(container).toBeVisible();
    const startResults = await selectionView.queryByTestId('start-results');
    expect(startResults).toBeNull();
    const endResults = await selectionView.queryByTestId('end-results');
    expect(endResults).toBeNull();
  });

  it('should display results when similar text is entered to the search', async () => {
    const selectionView = render(<BuildingSelection selectedBuilding={null} mode={"browse"} onSelect={mockOnSelect} />)
    const searchInput = selectionView.getByPlaceholderText("Search building");

    fireEvent(searchInput, "focus");
    fireEvent.changeText(searchInput, "Hall");

    expect(searchInput.props.value).toBe("Hall");
    const searchResults = await selectionView.findByTestId('end-results');
    expect(searchResults).toBeVisible();
    const hallResult = await selectionView.findByTestId('end-result-H');
    expect(hallResult).toBeVisible();
  });

  it('should not display results when text that does not match any building is entered', async () => {
    const selectionView = render(<BuildingSelection selectedBuilding={null} mode={"browse"} onSelect={mockOnSelect} />)
    const searchInput = selectionView.getByPlaceholderText("Search building");

    fireEvent(searchInput, 'focus');
    fireEvent.changeText(searchInput, 'Nonexistent Building');

    const searchResults = await selectionView.queryByTestId('end-results');
    expect(searchResults).toBeNull();
  });

  it('should clear the input when the clear button is pressed', async () => {
    const selectionView = render(<BuildingSelection selectedBuilding={null} mode={"browse"} onSelect={mockOnSelect} />)
    const searchInput = selectionView.getByPlaceholderText("Search building");

    fireEvent(searchInput, 'focus');
    fireEvent.changeText(searchInput, 'Hall');

    const clearButton = await selectionView.findByTestId('clear-end');

    fireEvent.press(clearButton);

    expect(searchInput.props.value).toBe("");
  });

});

describe("BuildingSelection Directions", () => {
  it('should swap the start and end fields when the swap button is pressed', async () => {
    const selectionView = render(<BuildingSelection selectedBuilding={null} mode={"directions"} onSelect={mockOnSelect} />)
    const startInput = selectionView.getByPlaceholderText("Your location");
    const endInput = selectionView.getByPlaceholderText("Destination");

    fireEvent(startInput, 'focus');
    fireEvent.changeText(startInput, 'Hall');

    const swapButton = await selectionView.findByTestId('swap-fields');

    fireEvent.press(swapButton);

    expect(startInput.props.value).toBe("");
    expect(endInput.props.value).toBe("Hall");
  });

  it('should remove display results a result is pressed, call the onSelect, and set the query correctly', async () => {
    const selectionView = render(<BuildingSelection selectedBuilding={null} mode={"directions"} onSelect={mockOnSelect} />)
    const startInput = selectionView.getByPlaceholderText("Your location");

    fireEvent(startInput, 'focus');
    fireEvent.changeText(startInput, 'Hall');

    const hallResult = await selectionView.findByTestId('start-result-H');

    fireEvent.press(hallResult);

    const startResultsAfterPress = await selectionView.queryByTestId('start-results');
    expect(startResultsAfterPress).toBeNull();
    expect(mockOnSelect).toHaveBeenCalledWith(
      {
        start: {
          buildingCode: "H",
          buildingName: "Henry F. Hall Building",
          address: "1455 Blvd. De Maisonneuve Ouest, Montreal, QC H3G 1M8",
          campus: "SGW"
        },
        end: null
      }, "start"
    );
    expect(startInput.props.value).toBe("Henry F. Hall Building");
  });

  it('should prioritize current buildings when typing in Search building field', async () => {
    const selectionView = render(<BuildingSelection currentBuildingCodes={new Set(["B"])} selectedBuilding={null} mode={"directions"} onSelect={mockOnSelect} />)
    const startInput = selectionView.getByPlaceholderText("Your location");

    fireEvent(startInput, 'focus');
    fireEvent.changeText(startInput, 'Annex');

    const startResults = await selectionView.findByTestId('start-results');
    expect(startResults).toBeVisible();
    // Get all the result items - B (current) should come before CI and CL
    const allResults = selectionView.getAllByTestId(/^start-result-/);
    expect(allResults.length).toBeGreaterThan(0);
    // Verify that B (current building) is the first result
    expect(allResults[0].props.testID).toBe('start-result-B');
    // Verify other annex buildings also appear
    const ciResult = await selectionView.findByTestId('start-result-CI');
    expect(ciResult).toBeVisible();
  });

  it('should maintain backward compatibility when no currentBuildingCodes provided', async () => {
    const selectionView = render(<BuildingSelection selectedBuilding={null} mode={"directions"} onSelect={mockOnSelect} />)
    const startInput = selectionView.getByPlaceholderText("Your location");
    // Focus without text - should not show results
    fireEvent(startInput, 'focus');

    let startResults = await selectionView.queryByTestId('start-results');
    expect(startResults).toBeNull();
    // Type text - should show results
    fireEvent.changeText(startInput, 'Hall');

    startResults = await selectionView.findByTestId('start-results');
    expect(startResults).toBeVisible();
    const hallResult = await selectionView.findByTestId('start-result-H');
    expect(hallResult).toBeVisible();
  });

  it("should update end field when focused and selectedBuilding changes", async () => {
    const { rerender, getByPlaceholderText } = render(<BuildingSelection selectedBuilding={null} mode="directions" onSelect={mockOnSelect} />);
    const endInput = getByPlaceholderText("Destination");

    fireEvent(endInput, "focus");

    rerender(
      <BuildingSelection
        selectedBuilding={{
          buildingCode: "CI",
          buildingName: "CI Annex",
          address: "2149 Mackay St., Montreal, QC",
          campus: "SGW"
        }}
        mode="directions"
        onSelect={mockOnSelect}
      />
    );

    expect(endInput.props.value).toBe("CI Annex");
  });

  it("should update previously focused field when selectedBuilding changes and no field focused", async () => {
    const selectionView = render(<BuildingSelection selectedBuilding={null} mode="directions" onSelect={mockOnSelect} />);
    const startInput = selectionView.getByPlaceholderText("Your location");

    fireEvent(startInput, "focus");
    fireEvent(startInput, "blur");

    selectionView.rerender(
      <BuildingSelection
        selectedBuilding={{
          buildingCode: "CL",
          buildingName: "CL Annex",
          address: "1665 Ste-Catherine St. W., Montreal, QC",
          campus: "SGW"
        }}
        mode="directions"
        onSelect={mockOnSelect}
      />
    );

    expect(startInput.props.value).toBe("");
  });

  it("should update start field when focused and selectedBuilding changes (prop change)", async () => {
    const { rerender, getByPlaceholderText } = render(<BuildingSelection selectedBuilding={null} mode="directions" onSelect={mockOnSelect} />);
    const startInput = getByPlaceholderText("Your location");

    fireEvent(startInput, "focus");

    rerender(
      <BuildingSelection
        selectedBuilding={{
          buildingCode: "CI",
          buildingName: "CI Annex",
          address: "2149 Mackay St., Montreal, QC",
          campus: "SGW"
        }}
        mode="directions"
        onSelect={mockOnSelect}
      />
    );

    expect(startInput.props.value).toBe("CI Annex");
  });
});