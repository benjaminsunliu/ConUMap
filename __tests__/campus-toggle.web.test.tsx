import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import CampusToggle from "@/components/map/campus-toggle.web";

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("react-native-switch-selector", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  return function MockSwitchSelector(props: any) {
    return (
      <View testID={props.testID}>
        <Text testID="selected-campus">{String(props.value)}</Text>
        {props.options.map((option: { label: string; value: number }) => (
          <Pressable
            key={option.label}
            testID={`option-${option.label}`}
            onPress={() => props.onPress(option.value)}
          >
            <Text>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  };
});

const nearSGW = {
  latitude: 45.4959,
  longitude: -73.5772,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const nearLOY = {
  latitude: 45.4578,
  longitude: -73.6396,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

describe("campus-toggle.web", () => {
  it("selects the closest campus on initial render", () => {
    const mapRef = { current: { animateToRegion: jest.fn() } };
    const { getByTestId } = render(<CampusToggle mapRef={mapRef} viewRegion={nearSGW} />);

    // Campus.SGW is enum value 1.
    expect(getByTestId("selected-campus").props.children).toBe("1");
  });

  it("animates map when user switches campus", () => {
    const animateToRegion = jest.fn();
    const mapRef = { current: { animateToRegion } };
    const { getByTestId } = render(<CampusToggle mapRef={mapRef} viewRegion={nearLOY} />);

    fireEvent.press(getByTestId("option-SGW"));

    expect(animateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 45.4957849,
        longitude: -73.577225,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }),
    );
  });

  it("syncs from map region changes and ignores resulting programmatic selector callback", () => {
    const animateToRegion = jest.fn();
    const mapRef = { current: { animateToRegion } };
    const { getByTestId, rerender } = render(
      <CampusToggle mapRef={mapRef} viewRegion={nearSGW} />,
    );

    rerender(<CampusToggle mapRef={mapRef} viewRegion={nearLOY} />);

    // Simulate selector callback caused by controlled value sync.
    fireEvent.press(getByTestId("option-LOY"));
    expect(animateToRegion).not.toHaveBeenCalled();

    fireEvent.press(getByTestId("option-SGW"));
    expect(animateToRegion).toHaveBeenCalledTimes(1);
  });
});
