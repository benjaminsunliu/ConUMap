import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import { POIInfoPopup } from "../components/map/poi-info-popup";
import { POI } from "../types/mapTypes";

jest.mock("react-native", () => {
  const rn = jest.requireActual("react-native");

  rn.PanResponder.create = (config) => ({
    panHandlers: {
      onResponderGrant: config.onPanResponderGrant,
      onResponderMove: config.onPanResponderMove,
      onResponderRelease: config.onPanResponderRelease,
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
    },
  });

  return rn;
});

const mockPOI: POI = {
  place_id: "ChIJr-QYHWoayUwRkrZ4ksUN7o4",
  name: "Clinique Chiropratique C3VN",
  vicinity: "1440 Rue Sainte-Catherine Ouest #402, Montreal",
  rating: 4.8,
  user_ratings_total: 192,
  international_phone_number: "+1 514-544-2386",
  types: ["gym", "health", "point_of_interest", "establishment"],
  geometry: {
    location: {
      lat: 45.497,
      lng: -73.578,
    },
    viewport: {
      northeast: {
        lat: 45.498,
        lng: -73.577,
      },
      southwest: {
        lat: 45.496,
        lng: -73.579,
      },
    },
  },
  opening_hours: {
    open_now: true,
  },
};

const mockOnNavigate = jest.fn();

jest.spyOn(Linking, "openURL").mockImplementation(jest.fn());
jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);

describe("poi-info-popup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
  });

  it("renders nothing if poi is null", () => {
    const { queryByTestId } = render(<POIInfoPopup poi={null} />);
    expect(queryByTestId("poi-info-popup")).toBeNull();
  });

  it("renders the expected POI details", () => {
    render(<POIInfoPopup poi={mockPOI} />);

    expect(screen.getByText("Clinique Chiropratique C3VN")).toBeTruthy();
    expect(screen.getByText("⭐4.8")).toBeTruthy();
    expect(screen.getByText("(192)")).toBeTruthy();
    expect(screen.getByText("Open Now")).toBeTruthy();
    expect(screen.getByText("+1 514-544-2386")).toBeTruthy();
    expect(
      screen.getByText("1440 Rue Sainte-Catherine Ouest #402, Montreal"),
    ).toBeTruthy();
  });

  it('calls onNavigate when "Directions" is pressed', async () => {
    render(<POIInfoPopup poi={mockPOI} onNavigate={mockOnNavigate} />);

    const directionsButton = screen.getByTestId("directions-action-button");

    await act(async () => {
      await fireEvent.press(directionsButton);
    });

    expect(mockOnNavigate).toHaveBeenCalled();
  });

  it('opens tel URL when "Call" is pressed', async () => {
    render(<POIInfoPopup poi={mockPOI} />);

    const callButton = screen.getByTestId("call-action-button");
    await act(async () => {
      await fireEvent.press(callButton);
    });

    expect(Linking.canOpenURL).toHaveBeenCalledWith("tel:+1 514-544-2386");
    expect(Linking.openURL).toHaveBeenCalledWith("tel:+1 514-544-2386");
  });

  it("does not call openURL if canOpenURL returns false", async () => {
    jest.spyOn(Linking, "canOpenURL").mockResolvedValueOnce(false);
    render(<POIInfoPopup poi={mockPOI} />);

    const callButton = screen.getByTestId("call-action-button");
    await act(async () => {
      await fireEvent.press(callButton);
    });

    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
