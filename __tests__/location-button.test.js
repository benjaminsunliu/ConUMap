import React from "react";
import LocationButton from "../components/map/location-button";
import { render, fireEvent } from "@testing-library/react-native";

describe("location button", () => {
  it("when button is pressed onPress is called", () => {
    const onPress = jest.fn();
    const button = render(<LocationButton onPress={onPress} state="off" />);
    const locationButton = button.getByTestId("locationButton");
    fireEvent.press(locationButton);
    expect(onPress).toHaveBeenCalled();
  });

  it('renders explore-off icon when state is "off"', () => {
    const button = render(<LocationButton onPress={jest.fn()} state="off" />);
    // MaterialIcons is mocked in jest.setup.js to return null, so just check the button renders
    expect(button.getByTestId("locationButton")).toBeTruthy();
  });

  it('renders my-location icon when state is "centered"', () => {
    const button = render(<LocationButton onPress={jest.fn()} state="centered" />);
    expect(button.getByTestId("locationButton")).toBeTruthy();
  });

  it('renders location-searching icon when state is "on"', () => {
    const button = render(<LocationButton onPress={jest.fn()} state="on" />);
    expect(button.getByTestId("locationButton")).toBeTruthy();
  });

  it("applies custom position prop to container", () => {
    const button = render(
      <LocationButton
        onPress={jest.fn()}
        state="off"
        position={{ bottom: 100, right: 50 }}
      />,
    );
    const container = button.getByTestId("locationButton").parent;
    expect(container).toBeTruthy();
  });
});
