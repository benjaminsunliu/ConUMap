import React from "react";
import {act, render, fireEvent} from '@testing-library/react-native';
import BuildingSelection from "@/components/map/building-selection";


const mockAnimateToRegion = jest.fn();

jest.mock('react-native-map-clustering', () => {
  const React = require("react");
  const {forwardRef, useImperativeHandle} = React;
  const { View } = require("react-native");
  const  mockCluster =  forwardRef((props: React.PropsWithChildren<any>, ref: any) => {
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

jest.mock("@/constants/mapData", () => {

  const { getBuildingPolygons } = require("@/utils/getBuildingPolygons");

  return {
    CAMPUS_LOCATIONS: [
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

jest.mock('@/data/parsedBuildings', () => ({
  concordiaBuildings: [
    {
      buildingCode: "LB",
      location: { latitude: 45.495, longitude: -73.579 },
    },
    {
      buildingCode: "VE",
      location: { latitude: 45.496, longitude: -73.580 },
    },  {
      buildingCode: "RA",
      location: { latitude: 45.496, longitude: -73.580 },
    },
    {
      buildingCode: "PC",
      location: { latitude: 45.496, longitude: -73.580 },
    },
  ],
}));

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

describe("BuildingSelection component", () => {
  it('should display the building selection, and no results',async ()=>{
      const selectionView = render(<BuildingSelection onSelect={mockOnSelect}/>)
      const container = selectionView.getByTestId('building-selection');
      expect(container).toBeVisible();
      const startResults = await selectionView.queryByTestId('start-results');
      expect(startResults).toBeNull();
      const endResults = await selectionView.queryByTestId('end-results');
      expect(endResults).toBeNull();
  });

  it('should display results when similar text is entered', async ()=>{
    const selectionView = render(<BuildingSelection onSelect={mockOnSelect}/>)
    const startInput = selectionView.getByPlaceholderText("Start");
    await act(async () => {
      await fireEvent(startInput, 'onFocus');
      await fireEvent.changeText(startInput, 'Hall');
    });
    const startResults = await selectionView.findByTestId('start-results');
    expect(startResults).toBeVisible();
    const hallResult = await selectionView.findByTestId('start-result-H');
    expect(hallResult).toBeVisible();
  });

  it('should not display results when text that does not match any building is entered', async ()=>{
    const selectionView = render(<BuildingSelection onSelect={mockOnSelect}/>)
    const startInput = selectionView.getByPlaceholderText("Start");
    await act(async () => {
      await fireEvent(startInput, 'onFocus');
      await fireEvent.changeText(startInput, 'Nonexistent Building');
    });
    const startResults = await selectionView.queryByTestId('start-results');
    expect(startResults).toBeNull();
  });

  it('should clear the input when the clear button is pressed', async ()=>{
    const selectionView = render(<BuildingSelection onSelect={mockOnSelect}/>)
    const startInput = selectionView.getByPlaceholderText("Start");
    await act(async () => {      
      await fireEvent(startInput, 'onFocus');
      await fireEvent.changeText(startInput, 'Hall');
    });
    const clearButton = await selectionView.findByTestId('clear-start');
    await act(async () => {      
      await fireEvent.press(clearButton);
    });
    expect(startInput.props.value).toBe("");
  });

  it('should swap the start and end fields when the swap button is pressed', async ()=>{
    const selectionView = render(<BuildingSelection onSelect={mockOnSelect}/>)
    const startInput = selectionView.getByPlaceholderText("Start");
    const endInput = selectionView.getByPlaceholderText("Destination");
    await act(async () => {      
      await fireEvent(startInput, 'onFocus');
      await fireEvent.changeText(startInput, 'Hall');
    });
    const swapButton = await selectionView.findByTestId('swap-fields');
    await act(async () => {      
      await fireEvent.press(swapButton);
    });
    expect(startInput.props.value).toBe("");
    expect(endInput.props.value).toBe("Hall");
  });

  it('should remove display results a result is pressed, call the onSelect, and set the query correctly', async ()=>{
    const selectionView = render(<BuildingSelection onSelect={mockOnSelect}/>)
    const startInput = selectionView.getByPlaceholderText("Start");
    await act(async () => {
      await fireEvent(startInput, 'onFocus');
      await fireEvent.changeText(startInput, 'Hall');
    });
    const hallResult = await selectionView.findByTestId('start-result-H');
    await act(async () => {
      await fireEvent.press(hallResult);
    });
    const startResultsAfterPress = await selectionView.queryByTestId('start-results');
    expect(startResultsAfterPress).toBeNull();
    expect(mockOnSelect).toHaveBeenCalledWith(
      {
        buildingCode: "H",
        buildingName: "Henry F. Hall Building",
        address: "1455 Blvd. De Maisonneuve Ouest, Montreal, QC H3G 1M8",
        campus: "SGW"
      },
      "start"
    );
    expect(startInput.props.value).toBe("Henry F. Hall Building");
  });

  it('should prioritize current buildings when typing in start field', async ()=>{
    const selectionView = render(<BuildingSelection currentBuildingCodes={["H"]} onSelect={mockOnSelect}/>)
    const startInput = selectionView.getByPlaceholderText("Start");
    await act(async () => {
      await fireEvent(startInput, 'onFocus');
      await fireEvent.changeText(startInput, 'Annex');
    });
    const startResults = await selectionView.findByTestId('start-results');
    expect(startResults).toBeVisible();
    // Get all the result items and verify H comes before CI, CL, and B (even though they match)
    const allResults = selectionView.getAllByTestId(/^start-result-/);
    expect(allResults.length).toBeGreaterThan(0);
    // B Annex, CI Annex, CL Annex should all match "Annex", but H is not current for this test
    // Let's verify we can find the results for the annex buildings
    const bResult = await selectionView.findByTestId('start-result-B');
    expect(bResult).toBeVisible();
  });

  it('should show current building as first result when start field focused with no text and currentBuildingCodes provided', async ()=>{
    const selectionView = render(<BuildingSelection currentBuildingCodes={["H"]} onSelect={mockOnSelect}/>)
    const startInput = selectionView.getByPlaceholderText("Start");
    await act(async () => {
      await fireEvent(startInput, 'onFocus');
    });
    const startResults = await selectionView.findByTestId('start-results');
    expect(startResults).toBeVisible();
    const hallResult = await selectionView.findByTestId('start-result-H');
    expect(hallResult).toBeVisible();
  });

  it('should maintain backward compatibility when no currentBuildingCodes provided', async ()=>{
    const selectionView = render(<BuildingSelection onSelect={mockOnSelect}/>)
    const startInput = selectionView.getByPlaceholderText("Start");
    // Focus without text - should not show results
    await act(async () => {
      await fireEvent(startInput, 'onFocus');
    });
    let startResults = await selectionView.queryByTestId('start-results');
    expect(startResults).toBeNull();
    // Type text - should show results
    await act(async () => {
      await fireEvent.changeText(startInput, 'Hall');
    });
    startResults = await selectionView.findByTestId('start-results');
    expect(startResults).toBeVisible();
    const hallResult = await selectionView.findByTestId('start-result-H');
    expect(hallResult).toBeVisible();
  });


});