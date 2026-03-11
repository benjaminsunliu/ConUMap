import React from "react";
import BuildingInfoPopup from "../components/map/building-info-popup";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { CAMPUS_BUILDINGS } from "../constants/map";
import { Linking } from "react-native";

const mockBuilding = CAMPUS_BUILDINGS[22]; // Hall Building

jest.mock("react-native", () => {
  const rn = jest.requireActual("react-native");

  rn.PanResponder.create = (config) => ({
    panHandlers: {
      // Map the internal responder names to your config names
      onResponderGrant: config.onPanResponderGrant,
      onResponderMove: config.onPanResponderMove,
      onResponderRelease: config.onPanResponderRelease,
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
    },
  });
  return rn;
});

const mockOnNavigate = jest.fn();
const mockOnSetAsStart = jest.fn();

jest.spyOn(Linking, "openURL").mockImplementation(jest.fn());
jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);

describe("building-info-popup", () => {
  it("renders nothing if building is null", () => {
    const { queryByTestId } = render(<BuildingInfoPopup building={null} />);
    expect(queryByTestId("building-info-popup")).toBeNull();
  });

  it("returns a non-null object if a valid building object is supplied", () => {
    const { queryByTestId } = render(<BuildingInfoPopup building={mockBuilding} />);
    expect(queryByTestId("building-info-popup")).toBeDefined();
  });

  it("renders the correct popup for the supplied building", () => {
    const { getByText } = render(<BuildingInfoPopup building={mockBuilding} />);

    expect(getByText("H – Henry F. Hall Building")).toBeTruthy();
    expect(getByText("SGW Campus | 1455 De Maisonneuve Blvd. W.")).toBeTruthy();
    expect(getByText(/^Today:/)).toBeTruthy();
  });

  it('calls the on navigate function when "Directions" is pressed', async () => {
    render(<BuildingInfoPopup building={mockBuilding} onNavigate={mockOnNavigate} />);

    const directionsButton = screen.getByTestId("directions-action-button");

    await act(async () => {
      await fireEvent.press(directionsButton);
    });

    expect(mockOnNavigate).toHaveBeenCalled();
  });

  it('calls the on set-as-start function when "Set Start" is pressed', async () => {
    render(
      <BuildingInfoPopup
        building={mockBuilding}
        onNavigate={mockOnNavigate}
        onSetAsStart={mockOnSetAsStart}
      />,
    );

    const startButton = screen.getByTestId("start-action-button");

    await act(async () => {
      await fireEvent.press(startButton);
    });

    expect(mockOnSetAsStart).toHaveBeenCalled();
  });

  it('opens the correct link when "Website" is pressed', async () => {
    render(<BuildingInfoPopup building={mockBuilding} onNavigate={mockOnNavigate} />);

    const websiteButton = screen.getByTestId("website-action-button");
    await act(async () => {
      await fireEvent.press(websiteButton);
    });

    expect(Linking.openURL).toHaveBeenCalledWith(mockBuilding.url);
  });

  it("does not open URL when building has no link", async () => {
    Linking.openURL.mockClear();
    const buildingNoLink = { ...mockBuilding, url: "" };
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    render(<BuildingInfoPopup building={buildingNoLink} />);

    const websiteButton = screen.getByTestId("website-action-button");
    await act(async () => {
      await fireEvent.press(websiteButton);
    });

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("No URL available"));
    warnSpy.mockRestore();
  });

  it("does not open URL when canOpenURL returns false", async () => {
    Linking.openURL.mockClear();
    jest.spyOn(Linking, "canOpenURL").mockResolvedValueOnce(false);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    render(<BuildingInfoPopup building={mockBuilding} />);

    const websiteButton = screen.getByTestId("website-action-button");
    await act(async () => {
      await fireEvent.press(websiteButton);
    });

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Cannot open URL"));
    warnSpy.mockRestore();
  });

  it("catches errors thrown by Linking.openURL", async () => {
    jest.spyOn(Linking, "canOpenURL").mockResolvedValueOnce(true);
    jest.spyOn(Linking, "openURL").mockRejectedValueOnce(new Error("Permission denied"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<BuildingInfoPopup building={mockBuilding} />);

    const websiteButton = screen.getByTestId("website-action-button");
    await act(async () => {
      await fireEvent.press(websiteButton);
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to open URL"),
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it("falls back to Linking when Directions is pressed without onNavigate prop", async () => {
    render(<BuildingInfoPopup building={mockBuilding} />);

    const directionsButton = screen.getByTestId("directions-action-button");
    await act(async () => {
      await fireEvent.press(directionsButton);
    });

    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining("google.com/maps"),
    );
  });

  it("shows accessibility items when building has accessibility features", async () => {
    const buildingWithAccessibility = {
      ...mockBuilding,
      accessibility: ["wheelchairAccessible", "elevatorAvailable"],
    };
    render(<BuildingInfoPopup building={buildingWithAccessibility} />);

    const popup = screen.getByTestId("building-info-popup");
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });

    const accessibilityTitle = await screen.findByText("Accessibility");
    expect(accessibilityTitle).toBeTruthy();
    // formatCamelCase should split the camelCase strings
    expect(await screen.findByText("Wheelchair Accessible")).toBeTruthy();
    expect(await screen.findByText("Elevator Available")).toBeTruthy();
  });
});

describe("building-info-popup-panresponder", () => {
  it("expands when dragging the past the midpoint", async () => {
    render(<BuildingInfoPopup building={mockBuilding} />);

    const popup = screen.getByTestId("building-info-popup");

    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });

    const openingHoursTitle = await screen.findByText("Opening Hours");

    expect(openingHoursTitle).toBeTruthy();
  });

  it("stays collapsed when the drag is too small", async () => {
    render(<BuildingInfoPopup building={mockBuilding} />);

    const popup = screen.getByTestId("building-info-popup");

    expect(screen.queryByText("Opening Hours")).toBeNull(); // Should initially be null

    await act(async () => {
      popup.props.onResponderRelease({}, { dy: -50, vy: 0 });
    });

    await waitFor(() => {
      expect(screen.queryByText("Opening Hours")).toBeNull();
    });
  });
  it("warns and does nothing if website URL is empty", async () => {
    jest.clearAllMocks();

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const buildingWithoutUrl = {
      ...mockBuilding,
      url: "", // force empty
    };

    render(<BuildingInfoPopup building={buildingWithoutUrl} />);

    const websiteButton = screen.getByTestId("website-action-button");

    await act(async () => {
      fireEvent.press(websiteButton);
    });

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("No URL available"));

    warnSpy.mockRestore();
  });
});
