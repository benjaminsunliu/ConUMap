import React from "react";
import { render ,fireEvent} from "@testing-library/react-native";
import * as RN from 'react-native';
import CampusToggle from '../campus-toggle'


const mapRef = { current: { animateToRegion: jest.fn() } };

const viewRegionNearLOY = { latitude: 45.458, longitude: -73.640, latitudeDelta: 0.01, longitudeDelta: 0.01 };

const viewRegionNearSGW = { latitude: 45.496, longitude: -73.577, latitudeDelta: 0.01, longitudeDelta: 0.01 };

describe("campus-toggle",()=>{
   
    
  it("initial switchValue is SGW if viewRegion is closer to SGW", () => {
    const { getByText } = render(<CampusToggle mapRef={mapRef} viewRegion={viewRegionNearSGW} />);
    const sgwButton = getByText("SGW");
    expect(sgwButton.props.style.some((s: any) => s.fontWeight === "bold")).toBeTruthy();
  });
  it("initial selection is LOY if viewRegion is closer to LOY", () => {
    const { getByText } = render(<CampusToggle mapRef={mapRef} viewRegion={viewRegionNearLOY} />);
    const loyButton = getByText("Loyola");
    expect(loyButton.props.style.some((s: any) => s.fontWeight === "bold")).toBeTruthy();
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
    const loyButton = getByText("Loyola");
    fireEvent.press(loyButton);
    expect(mapRef.current?.animateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 45.4578596, longitude: -73.6395856 })
    );
  });
})