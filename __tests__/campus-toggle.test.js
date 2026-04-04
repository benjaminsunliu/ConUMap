import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import CampusToggle from "../components/map/campus-toggle";

const mapRef = { current: { animateToRegion: jest.fn() } };
const setCurrCampus = jest.fn();

const viewRegionNearLOY = {
  latitude: 45.458,
  longitude: -73.64,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const viewRegionNearSGW = {
  latitude: 45.496,
  longitude: -73.577,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

describe("campus-toggle", () => {
  beforeEach(() => {
    setCurrCampus.mockClear();
  });

  it("initial switchValue is SGW if viewRegion is closer to SGW", async () => {
    const { getByText } = render(
      <CampusToggle
        mapRef={mapRef}
        viewRegion={viewRegionNearSGW}
        setCurrCampus={setCurrCampus}
      />,
    );
    const sgwButton = getByText("SGW");
    expect(sgwButton.props.style.some((s) => s.color === "#000000")).toBeTruthy();
    await waitFor(() => {
      expect(setCurrCampus).toHaveBeenCalledWith("SGW");
    });
  });

  it("initial selection is LOY if viewRegion is closer to LOY", async () => {
    const { getByText } = render(
      <CampusToggle
        mapRef={mapRef}
        viewRegion={viewRegionNearLOY}
        setCurrCampus={setCurrCampus}
      />,
    );
    const loyButton = getByText("LOY");
    expect(loyButton.props.style.some((s) => s.color === "#000000")).toBeTruthy();
    await waitFor(() => {
      expect(setCurrCampus).toHaveBeenCalledWith("LOY");
    });
  });

  it("pressing SGW button animates map to SGW_CENTER and syncs campus", async () => {
    const { getByText } = render(
      <CampusToggle
        mapRef={mapRef}
        viewRegion={viewRegionNearLOY}
        setCurrCampus={setCurrCampus}
      />,
    );
    const sgwButton = getByText("SGW");
    fireEvent.press(sgwButton);
    expect(mapRef.current?.animateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 45.4957849, longitude: -73.577225 }),
    );
    await waitFor(() => {
      expect(setCurrCampus).toHaveBeenLastCalledWith("SGW");
    });
  });

  it("pressing LOY button animates map to LOY_CENTER and syncs campus", async () => {
    const { getByText } = render(
      <CampusToggle
        mapRef={mapRef}
        viewRegion={viewRegionNearSGW}
        setCurrCampus={setCurrCampus}
      />,
    );
    const loyButton = getByText("LOY");
    fireEvent.press(loyButton);
    expect(mapRef.current?.animateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 45.4578596, longitude: -73.6395856 }),
    );
    await waitFor(() => {
      expect(setCurrCampus).toHaveBeenLastCalledWith("LOY");
    });
  });

  it("updates switchValue when viewRegion prop changes to the other campus", async () => {
    const { getByText, rerender } = render(
      <CampusToggle
        mapRef={mapRef}
        viewRegion={viewRegionNearSGW}
        setCurrCampus={setCurrCampus}
      />,
    );
    // Initially SGW is selected
    expect(getByText("SGW").props.style.some((s) => s.color === "#000000")).toBeTruthy();
    await waitFor(() => {
      expect(setCurrCampus).toHaveBeenCalledWith("SGW");
    });

    // Rerender with a region near LOY
    rerender(
      <CampusToggle
        mapRef={mapRef}
        viewRegion={viewRegionNearLOY}
        setCurrCampus={setCurrCampus}
      />,
    );

    // Now LOY should be selected as the active tab
    expect(getByText("LOY").props.style.some((s) => s.color === "#000000")).toBeTruthy();
    await waitFor(() => {
      expect(setCurrCampus).toHaveBeenLastCalledWith("LOY");
    });
  });
});
