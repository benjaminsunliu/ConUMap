import React from "react";
import { render ,fireEvent} from "@testing-library/react-native";
import CampusToggle from '../components/map/campus-toggle';


const mapRef = { current: { animateToRegion: jest.fn() } };

const viewRegionNearLOY = { latitude: 45.458, longitude: -73.640, latitudeDelta: 0.01, longitudeDelta: 0.01 };

const viewRegionNearSGW = { latitude: 45.496, longitude: -73.577, latitudeDelta: 0.01, longitudeDelta: 0.01 };

jest.mock('@/utils/e2e', () => ({ IS_E2E: true }));
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = (props) => <View {...props} />;
  const MockMarker = (props) => <View {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

describe("campus-toggle",()=>{
   
    
  it("initial switchValue is SGW if viewRegion is closer to SGW", () => {
    const { getByText } = render(<CampusToggle mapRef={mapRef} viewRegion={viewRegionNearSGW} />);
    const sgwButton = getByText("SGW");
    expect(sgwButton.props.style.some((s => s.color === "#000000"))).toBeTruthy();
  });
  it("initial selection is LOY if viewRegion is closer to LOY", () => {
    const { getByText } = render(<CampusToggle mapRef={mapRef} viewRegion={viewRegionNearLOY} />);
    const loyButton = getByText("LOY");
    expect(loyButton.props.style.some(((s) => s.color === "#000000"))).toBeTruthy();
  });
  
  it("pressing SGW button animates map to SGW_CENTER", () => {
    const { getByText } = render(<CampusToggle mapRef={mapRef} viewRegion={viewRegionNearLOY} />);
    const sgwButton = getByText("SGW");
    fireEvent.press(sgwButton);
    expect(mapRef.current?.animateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 45.4957849, longitude: -73.577225 })
    );
  });

  it("pressing LOY button animates map to LOY_CENTER", () => {
    const { getByText } = render(<CampusToggle mapRef={mapRef} viewRegion={viewRegionNearSGW} />);
    const loyButton = getByText("LOY");
    fireEvent.press(loyButton);
    expect(mapRef.current?.animateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 45.4578596, longitude: -73.6395856 })
    );
  });

  it("updates switchValue when viewRegion prop changes to the other campus", () => {
    const { getByText, rerender } = render(
      <CampusToggle mapRef={mapRef} viewRegion={viewRegionNearSGW} />
    );
    // Initially SGW is selected
    expect(getByText("SGW").props.style.some(s => s.color === "#000000")).toBeTruthy();

    // Rerender with a region near LOY
    rerender(<CampusToggle mapRef={mapRef} viewRegion={viewRegionNearLOY} />);

    // Now LOY should be selected as the active tab
    expect(getByText("LOY").props.style.some(s => s.color === "#000000")).toBeTruthy();
  });
})