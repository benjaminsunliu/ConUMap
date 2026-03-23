import React from "react";
import { act, render, fireEvent, waitFor } from "@testing-library/react-native";
import BuildingSelection from "@/components/map/building-selection";

const mockAnimateToRegion = jest.fn();

jest.mock("react-native-map-clustering", () => {
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
    default: mockCluster,
  };
});

jest.mock("expo-location", () => ({
  hasServicesEnabledAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock("@/utils/directions", () => ({
  fetchAllDirections: jest.fn().mockResolvedValue({
    walking: [],
    transit: [],
    driving: [],
    bicycling: [],
    shuttle: [],
  }),
}));

jest.mock("@/data/building-addresses.json", () => [
  {
    buildingCode: "B",
    buildingName: "B Annex",
    address: "2160 Bishop St, Montreal, QC",
    campus: "SGW",
  },
  {
    buildingCode: "CI",
    buildingName: "CI Annex",
    address: "2149 Mackay St., Montreal, QC",
    campus: "SGW",
  },
  {
    buildingCode: "CL",
    buildingName: "CL Annex",
    address: "1665 Ste-Catherine St. W., Montreal, QC",
    campus: "SGW",
  },
  {
    buildingCode: "H",
    buildingName: "Henry F. Hall Building",
    address: "1455 Blvd. De Maisonneuve Ouest, Montreal, QC H3G 1M8",
    campus: "SGW",
  },
  {
    buildingCode: "LB",
    buildingName: "J.W. McConnell Building",
    address: "1400 De Maisonneuve Blvd. W., Montreal, QC",
    campus: "SGW",
  },
]);

beforeEach(() => {
  mockAnimateToRegion.mockClear();
});

const mockOnSelect = jest.fn();

describe("BuildingSelection Browse", () => {
  it("should display the search bar, and no results", async () => {
    const selectionView = render(
      <BuildingSelection
        selectedBuilding={null}
        mode={"browse"}
        onSelect={mockOnSelect}
      />,
    );
    const container = selectionView.getByTestId("building-selection");
    expect(container).toBeVisible();
    const startResults = await selectionView.queryByTestId("start-results");
    expect(startResults).toBeNull();
    const endResults = await selectionView.queryByTestId("end-results");
    expect(endResults).toBeNull();
  });

  it("should display results when similar text is entered to the search", async () => {
    const selectionView = render(
      <BuildingSelection
        selectedBuilding={null}
        mode={"browse"}
        onSelect={mockOnSelect}
      />,
    );
    const searchInput = selectionView.getByPlaceholderText("Search building");

    fireEvent(searchInput, "focus");
    fireEvent.changeText(searchInput, "Hall");

    expect(searchInput.props.value).toBe("Hall");
    const searchResults = await selectionView.findByTestId("end-results");
    expect(searchResults).toBeVisible();
    const hallResult = await selectionView.findByTestId("end-result-H");
    expect(hallResult).toBeVisible();
  });

  it("should not display results when text that does not match any building is entered", async () => {
    const selectionView = render(
      <BuildingSelection
        selectedBuilding={null}
        mode={"browse"}
        onSelect={mockOnSelect}
      />,
    );
    const searchInput = selectionView.getByPlaceholderText("Search building");

    fireEvent(searchInput, "focus");
    fireEvent.changeText(searchInput, "Nonexistent Building");

    const searchResults = await selectionView.queryByTestId("end-results");
    expect(searchResults).toBeNull();
  });

  it("should clear the input when the clear button is pressed", async () => {
    const selectionView = render(
      <BuildingSelection
        selectedBuilding={null}
        mode={"browse"}
        onSelect={mockOnSelect}
      />,
    );
    const searchInput = selectionView.getByPlaceholderText("Search building");

    fireEvent(searchInput, "focus");
    fireEvent.changeText(searchInput, "Hall");

    const clearButton = await selectionView.findByTestId("clear-end");

    fireEvent.press(clearButton);

    expect(searchInput.props.value).toBe("");
  });
});

describe("BuildingSelection Directions", () => {
  it("should swap selected start and destination buildings", async () => {
    const selectionView = render(
      <BuildingSelection
        selectedBuilding={null}
        mode="directions"
        onSelect={mockOnSelect}
      />,
    );

    const startInput = selectionView.getByPlaceholderText("Your location");
    const endInput = selectionView.getByPlaceholderText("Destination");

    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "Hall");
    fireEvent.press(await selectionView.findByTestId("start-result-H"));

    fireEvent(endInput, "focus");
    fireEvent.changeText(endInput, "McConnell");
    fireEvent.press(await selectionView.findByTestId("end-result-LB"));

    const swapButton = await selectionView.findByTestId("swap-fields");
    fireEvent.press(swapButton);

    expect(startInput.props.value).toBe("J.W. McConnell Building");
    expect(endInput.props.value).toBe("Henry F. Hall Building");

    expect(mockOnSelect).toHaveBeenCalled();
  });

  it("should remove display results when a result is pressed, call the onSelect, and set the query correctly", async () => {
    const selectionView = render(
      <BuildingSelection
        selectedBuilding={null}
        mode={"directions"}
        onSelect={mockOnSelect}
      />,
    );
    const startInput = selectionView.getByPlaceholderText("Your location");

    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "Hall");

    const hallResult = await selectionView.findByTestId("start-result-H");

    fireEvent.press(hallResult);

    const startResultsAfterPress = await selectionView.queryByTestId("start-results");
    expect(startResultsAfterPress).toBeNull();
    expect(mockOnSelect).toHaveBeenCalledWith(
      {
        start: {
          buildingCode: "H",
          buildingName: "Henry F. Hall Building",
          address: "1455 Blvd. De Maisonneuve Ouest, Montreal, QC H3G 1M8",
          campus: "SGW",
        },
        end: null,
      },
      "start",
    );
    expect(startInput.props.value).toBe("Henry F. Hall Building");
    expect(
      (await selectionView.findByPlaceholderText("Destination")).props.value,
    ).toBeFalsy();
  });

  it("should prioritize current buildings when typing in Search building field", async () => {
    const selectionView = render(
      <BuildingSelection
        currentBuildingCodes={new Set(["B"])}
        selectedBuilding={null}
        mode={"directions"}
        onSelect={mockOnSelect}
      />,
    );
    const startInput = selectionView.getByPlaceholderText("Your location");

    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "Annex");

    const startResults = await selectionView.findByTestId("start-results");
    expect(startResults).toBeVisible();
    // Get all the result items - B (current) should come before CI and CL
    const allResults = selectionView.getAllByTestId(/^start-result-/);
    expect(allResults.length).toBeGreaterThan(0);
    // Verify that B (current building) is the first result
    expect(allResults[0].props.testID).toBe("start-result-B");
    // Verify other annex buildings also appear
    const ciResult = await selectionView.findByTestId("start-result-CI");
    expect(ciResult).toBeVisible();
  });

  it("should maintain backward compatibility when no currentBuildingCodes provided", async () => {
    const selectionView = render(
      <BuildingSelection
        selectedBuilding={null}
        mode={"directions"}
        onSelect={mockOnSelect}
      />,
    );
    const startInput = selectionView.getByPlaceholderText("Your location");
    // Focus without text - should not show results
    fireEvent(startInput, "focus");

    let startResults = await selectionView.queryByTestId("start-results");
    expect(startResults).toBeNull();
    // Type text - should show results
    fireEvent.changeText(startInput, "Hall");

    startResults = await selectionView.findByTestId("start-results");
    expect(startResults).toBeVisible();
    const hallResult = await selectionView.findByTestId("start-result-H");
    expect(hallResult).toBeVisible();
  });

  it("should update end field when focused and selectedBuilding changes", async () => {
    const { rerender, getByPlaceholderText } = render(
      <BuildingSelection
        selectedBuilding={null}
        mode="directions"
        onSelect={mockOnSelect}
      />,
    );
    const endInput = getByPlaceholderText("Destination");

    fireEvent(endInput, "focus");

    rerender(
      <BuildingSelection
        selectedBuilding={{
          buildingCode: "CI",
          buildingName: "CI Annex",
          address: "2149 Mackay St., Montreal, QC",
          campus: "SGW",
        }}
        mode="directions"
        onSelect={mockOnSelect}
      />,
    );

    expect(endInput.props.value).toBe("CI Annex");
  });

  it("shouldn't update previously focused field when selectedBuilding changes and no field focused", async () => {
    const selectionView = render(
      <BuildingSelection
        selectedBuilding={null}
        mode="directions"
        onSelect={mockOnSelect}
      />,
    );
    const startInput = selectionView.getByPlaceholderText("Your location");

    fireEvent(startInput, "focus");
    fireEvent(startInput, "blur");

    selectionView.rerender(
      <BuildingSelection
        selectedBuilding={{
          buildingCode: "CL",
          buildingName: "CL Annex",
          address: "1665 Ste-Catherine St. W., Montreal, QC",
          campus: "SGW",
        }}
        mode="directions"
        onSelect={mockOnSelect}
      />,
    );

    expect(startInput.props.value).toBe("");
  });

  it("should update start field when focused and selectedBuilding changes (prop change)", async () => {
    const { rerender, getByPlaceholderText } = render(
      <BuildingSelection
        selectedBuilding={null}
        mode="directions"
        onSelect={mockOnSelect}
      />,
    );
    const startInput = getByPlaceholderText("Your location");

    fireEvent(startInput, "focus");

    rerender(
      <BuildingSelection
        selectedBuilding={{
          buildingCode: "CI",
          buildingName: "CI Annex",
          address: "2149 Mackay St., Montreal, QC",
          campus: "SGW",
        }}
        mode="directions"
        onSelect={mockOnSelect}
      />,
    );

    expect(startInput.props.value).toBe("CI Annex");
  });
});

describe("BuildingSelection Integration Tests", () => {
  it("should remove display results when a result is pressed, call the onSelect, and set the query correctly", async () => {
    const MapViewer = require("@/components/map/map-viewer").default;
    const mapViewer = render(<MapViewer />);

    let searchBar = await mapViewer.findByPlaceholderText("Search building");

    fireEvent(searchBar, "focus");
    fireEvent.changeText(searchBar, "CL");

    const clResult = await mapViewer.findByTestId("end-result-CL");
    fireEvent.press(clResult);

    searchBar = await mapViewer.findByPlaceholderText("Search building");

    await waitFor(() => {
      expect(searchBar.props.value).toBeTruthy();
    });

    const directionsButton = await mapViewer.findByTestId("directions-action-button");

    await act(async () => {
      fireEvent.press(directionsButton);
    });

    const startInput = mapViewer.getByPlaceholderText("Your location");

    fireEvent(startInput, "focus");
    fireEvent.changeText(startInput, "Hall");

    const hallResult = await mapViewer.findByTestId("start-result-H");

    fireEvent.press(hallResult);

    await act(async () => {});

    const startResultsAfterPress = await mapViewer.queryByTestId("start-results");
    expect(startResultsAfterPress).toBeNull();

    await waitFor(() => {
      expect(mapViewer.getByPlaceholderText("Your location").props.value).toBe(
        "Henry F. Hall Building",
      );
    });

    await waitFor(() => {
      expect(mapViewer.getByPlaceholderText("Destination").props.value).toBe("CL Annex");
    });
  }, 10000);

  it("should set selected building as start when Set Start is pressed", async () => {
    const MapViewer = require("@/components/map/map-viewer").default;
    const mapViewer = render(<MapViewer />);

    const searchBar = await mapViewer.findByPlaceholderText("Search building");
    fireEvent(searchBar, "focus");
    fireEvent.changeText(searchBar, "CL");

    const clResult = await mapViewer.findByTestId("end-result-CL");
    fireEvent.press(clResult);

    const setStartButton = await mapViewer.findByTestId("start-action-button");
    await act(async () => {
      fireEvent.press(setStartButton);
    });

    await waitFor(() => {
      expect(mapViewer.getByPlaceholderText("Your location").props.value).toBe(
        "CL Annex",
      );
    });

    expect(mapViewer.getByPlaceholderText("Destination").props.value).toBe("CL Annex");
  });
});
