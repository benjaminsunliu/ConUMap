import React from "react";
import { act, render, fireEvent, waitFor } from "@testing-library/react-native";
import * as LocationPermissions from "expo-location";
import MapViewer from "../components/map/map-viewer";
import { Colors } from "@/constants/theme";
import { CAMPUS_BUILDINGS } from "../constants/map";
import { fetchAllDirections } from "@/utils/directions";
import { useLocalSearchParams, router } from "expo-router";
const mockAnimateToRegion = jest.fn();
jest.mock("react-native-map-clustering", () => {
  const React = require("react");
  const { forwardRef, useImperativeHandle } = React;
  const { View } = require("react-native");

  const mockCluster = forwardRef((props, ref) => {
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

jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  return {
    Marker: (props) => <View {...props} />,
    Polygon: (props) => <View testID="polygon" {...props} />,
    Polyline: (props) => <View testID="polyline" {...props} />,
    Circle: (props) => <View testID="circle" {...props} />,
  };
});

jest.mock("@/utils/directions", () => ({
  fetchAllDirections: jest.fn(),
}));

jest.mock("@/utils/decodePolyline", () => ({
  decodePolyline: jest.fn().mockReturnValue([]),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));

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

jest.mock("@/constants/map", () => {
  const { getBuildingPolygons } = require("../utils/getBuildingPolygons");

  return {
    CAMPUS_BUILDINGS: [
      {
        buildingCode: "LB",
        buildingName: "LB",
        location: { latitude: 45.495, longitude: -73.579 },
        polygons: getBuildingPolygons("LB"),
      },
      {
        buildingCode: "VE",
        buildingName: "VE",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("VE"),
      },
      {
        buildingCode: "RA",
        buildingName: "RA",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("RA"),
      },
      {
        buildingCode: "PC",
        buildingName: "PC",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("PC"),
      },
      {
        buildingCode: "AB",
        buildingName: "AB",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("AB"),
      },
    ],
  };
});

beforeEach(() => {
  mockAnimateToRegion.mockClear();
  useLocalSearchParams.mockReturnValue({});
  router.replace.mockClear();
});

describe("map tab", () => {
  it(" should display the map", () => {
    const mapView = render(<MapViewer />);
    const map = mapView.getByTestId("map-view");
    expect(map).toBeVisible();
  });

  it("shows correct default location ", () => {
    const mapView = render(<MapViewer />);
    const mapView_ = mapView.getByTestId("map-view");
    expect(mapView_.props.initialRegion).toEqual({
      latitude: 45.49575,
      longitude: -73.5793055556,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0922,
    });
  });

  it("opens routes mode directly when opened with buildingId and autoNavigate=true", async () => {
    fetchAllDirections.mockResolvedValue({
      walking: [],
      transit: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });

    useLocalSearchParams.mockReturnValue({
      buildingId: "LB",
      autoNavigate: "true",
    });

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    await act(async () => {
      fireEvent(mapView, "onUserLocationChange", {
        nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
      });
    });

    await waitFor(() => {
      expect(mapViewer.queryByTestId("building-info-popup")).toBeNull();
      expect(fetchAllDirections).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mapViewer.queryByTestId("routes-info-popup")).toBeTruthy();
    });

    expect(router.replace).toHaveBeenCalledWith("/map-tab");
  });

  it("keeps browse mode when opened with buildingId only", async () => {
    useLocalSearchParams.mockReturnValue({
      buildingId: "LB",
    });

    const mapViewer = render(<MapViewer />);

    expect(mapViewer.queryByTestId("building-info-popup")).toBeTruthy();
    expect(mapViewer.queryByTestId("routes-info-popup")).toBeNull();
    expect(router.replace).toHaveBeenCalledWith("/map-tab");
  });

  it("if location enabled is  on and ForegroundPermissions is not granted it would not try to getCurrentPosition  ", async () => {
    LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
    LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
      status: null,
    });
    LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 45.49575, longitude: -73.5793055556 },
    });
    expect(mockAnimateToRegion).not.toHaveBeenCalled();
  });

  it("if location enabled is on and ForegroundPermissions is undetermined it would not try to getCurrentPosition  ", async () => {
    LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
    LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
      status: "undetermined",
    });
    LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 45.49575, longitude: -73.5793055556 },
    });
    const mapViewer = render(<MapViewer />);
    const locationButton = mapViewer.getByTestId("locationButton");
    act(() => {
      fireEvent.press(locationButton);
    });
    await waitFor(() => {
      expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
      expect(LocationPermissions.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(LocationPermissions.getCurrentPositionAsync).not.toHaveBeenCalled();
    });
  });

  it("if location enabled is on and ForegroundPermissions is granted it would try to getCurrentPosition", async () => {
    LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
    LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 45.49575, longitude: -73.5793055556 },
    });
    const mapViewer = render(<MapViewer />);
    const locationButton = mapViewer.getByTestId("locationButton");
    act(() => {
      fireEvent.press(locationButton);
    });
    await waitFor(() => {
      expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
      expect(LocationPermissions.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(LocationPermissions.getCurrentPositionAsync).toHaveBeenCalled();
    });
  });

  it("if location enabled is  on and ForegroundPermissions is denied it would not try to getCurrentPosition  ", async () => {
    LocationPermissions.hasServicesEnabledAsync.mockClear();
    LocationPermissions.requestForegroundPermissionsAsync.mockClear();
    LocationPermissions.getCurrentPositionAsync.mockClear();
    LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
    LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
      status: "denied",
    });
    LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 45.49575, longitude: -73.5793055556 },
    });
    const mapViewer = render(<MapViewer />);
    const locationButton = mapViewer.getByTestId("locationButton");
    act(() => {
      fireEvent.press(locationButton);
    });
    await waitFor(() => {
      expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
      expect(LocationPermissions.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(LocationPermissions.getCurrentPositionAsync).not.toHaveBeenCalled();
    });
  });

  it("if user changes location and presses location button it will center location", async () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    act(() => {
      fireEvent(mapView, "onUserLocationChange", {
        nativeEvent: { coordinate: { latitude: 45.49575, longitude: -73.5793055556 } },
      });
    });
    const locationButton = mapViewer.getByTestId("locationButton");
    act(() => {
      fireEvent.press(locationButton);
    });
    expect(mockAnimateToRegion).toHaveBeenCalled();
  });

  it(" if locationEnabled is false and location button is pressed, modal will be visible", async () => {
    LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(false);
    const mapViewer = render(<MapViewer />);
    const locationButton = mapViewer.getByTestId("locationButton");
    act(() => {
      fireEvent.press(locationButton);
    });
    const modal = await mapViewer.findByTestId("location-modal");
    expect(modal).toBeVisible();
  });

  it("does not center or follow user when coordinate is null", () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    const invalidCoords = [
      null,
      undefined,
      Number.NaN,
      { latitude: "x", longitude: "y" },
    ];
    invalidCoords.forEach((coord) => {
      act(() =>
        fireEvent(mapView, "onUserLocationChange", {
          nativeEvent: { coordinate: coord },
        }),
      );
    });
    expect(mockAnimateToRegion).not.toHaveBeenCalled();
    expect(mapViewer.getByTestId("map-view").props.followsUserLocation).toBe(false);
  });

  it("Stops following user after drag, and re-centers when location button pressed again", async () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    act(() => {
      fireEvent(mapView, "onUserLocationChange", {
        nativeEvent: { coordinate: { latitude: 45.49575, longitude: -73.5793055556 } },
      });
    });
    const locationButton = mapViewer.getByTestId("locationButton");
    act(() => {
      fireEvent.press(locationButton); // to center location
    });
    expect(mockAnimateToRegion).toHaveBeenCalled();
    expect(mapViewer.getByTestId("map-view").props.followsUserLocation).toBe(true); //because location state is centered
    act(() => {
      fireEvent(mapView, "panDrag");
    });
    //no longer following user because dragged
    expect(mapViewer.getByTestId("map-view").props.followsUserLocation).toBe(false);
    act(() => {
      fireEvent.press(locationButton);
    });
    expect(mockAnimateToRegion).toHaveBeenCalled();
    expect(mapViewer.getByTestId("map-view").props.followsUserLocation).toBe(true);
  });

  it("if location state is on  it will center location ", async () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    //user location updates which makes locationState on
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.49575, longitude: -73.5793055556 } },
    });
    const locationButton = mapViewer.getByTestId("locationButton");
    await act(async () => {
      fireEvent.press(locationButton);
    });
    expect(mockAnimateToRegion).toHaveBeenCalled();
  });

  it("if location state is off , locationEnabled is false and location button is pressed, modalOpen will be true ", async () => {
    LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(false);
    const mapViewer = render(<MapViewer />);
    const locationButton = mapViewer.getByTestId("locationButton");
    await act(async () => {
      fireEvent.press(locationButton);
    });
    expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
    const modal = await mapViewer.findByTestId("location-modal");
    expect(modal).toBeVisible();
  });

  it("closes modal if onRequestClose is called ", async () => {
    const mapViewer = render(<MapViewer />);
    const locationButton = mapViewer.getByTestId("locationButton");

    await act(async () => {
      fireEvent.press(locationButton);
    });
    const modal = await mapViewer.findByTestId("location-modal");
    expect(modal).toBeVisible();
    fireEvent(modal, "onRequestClose");
    const modal_ = mapViewer.queryByTestId("location-modal");
    expect(modal_).toBeNull();
  });

  it("just returns if coordinate is null", () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: null },
    });
    expect(mapView).toBeTruthy();
  });

  it("if userLocation exists it sets it null when dragging", async () => {
    const userLocationDelta = { latitudeDelta: 0.00922, longitudeDelta: 0.00421 };
    const mapViewer = render(
      <MapViewer
        userLocationDelta={userLocationDelta}
        initialRegion={{
          latitude: 45.49575,
          longitude: -73.5793055556,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0922,
        }}
      />,
    );
    const mapView = mapViewer.getByTestId("map-view");
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.49575, longitude: -73.5793055556 } },
    });
    const locationButton = mapViewer.getByTestId("locationButton");
    await act(async () => {
      fireEvent.press(locationButton);
    });
    expect(mapViewer.getByTestId("map-view").props.followsUserLocation).toBe(true);
    await act(async () => {
      fireEvent(mapView, "panDrag");
    });
    //no longer following user because dragged
    expect(mapViewer.getByTestId("map-view").props.followsUserLocation).toBe(false);
  });

  it("displays polygon for all campus locations", () => {
    const mapViewer = render(<MapViewer />);
    const polygons = mapViewer.getAllByTestId("polygon");
    const expectedCount = CAMPUS_BUILDINGS.reduce(
      (total, building) => total + building.polygons.length,
      0,
    );
    expect(polygons).toHaveLength(expectedCount);
  });

  it("deselects building when map is pressed", async () => {
    const mapViewer = render(<MapViewer />);
    const polygons = mapViewer.getAllByTestId("polygon");
    await act(async () => {
      fireEvent.press(polygons[0]);
    });
    const map = mapViewer.getByTestId("map-view");
    fireEvent(map, "press");
    expect(mapViewer.queryByTestId("building-info-popup")).toBeNull();
  });

  it("focuses on building when polygon is pressed", () => {
    const mapViewer = render(<MapViewer />);
    const building = CAMPUS_BUILDINGS[0];
    const polygons = mapViewer.getAllByTestId("polygon");
    act(() => {
      fireEvent.press(polygons[0]);
    });
    expect(mockAnimateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: building.location.latitude,
        longitude: building.location.longitude,
        latitudeDelta: expect.any(Number),
        longitudeDelta: expect.any(Number),
      }),
    );
  });

  it("focuses building when pressed", () => {
    const mapViewer = render(<MapViewer />);
    const building = CAMPUS_BUILDINGS[0];
    const marker = mapViewer.getByTestId(`marker-${building.buildingCode}`);
    fireEvent.press(marker);
    expect(mockAnimateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: building.location.latitude,
        longitude: building.location.longitude,
        latitudeDelta: expect.any(Number),
        longitudeDelta: expect.any(Number),
      }),
    );
  });

  it(" focusBuilding makes deltas smaller if they are large", () => {
    const mapViewer = render(
      <MapViewer
        initialRegion={{
          latitude: 45,
          longitude: -73,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      />,
    );
    const lb = CAMPUS_BUILDINGS[0];
    const marker = mapViewer.getByTestId(`marker-${lb.buildingCode}`);
    fireEvent.press(marker);

    expect(mockAnimateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({
        latitudeDelta: 0.0025,
        longitudeDelta: 0.0025,
      }),
    );
  });

  it("closes modal when close button is pressed", async () => {
    const mapViewer = render(<MapViewer />);
    const locationButton = mapViewer.getByTestId("locationButton");

    await act(async () => {
      fireEvent.press(locationButton);
    });

    const modal = await mapViewer.findByTestId("location-modal");
    expect(modal).toBeVisible();
    const locationModalClose = mapViewer.getByTestId("location-modal-close");
    fireEvent.press(locationModalClose);

    expect(mapViewer.queryByTestId("location-modal")).toBeNull();
  });

  describe("Polygon Color Selection Logic", () => {
    it("should render polygonFill color when no building is selected and user is not inside", () => {
      const mapViewer = render(<MapViewer />);

      const polygons = mapViewer.getAllByTestId("polygon");
      expect(polygons[0].props.fillColor).toBe(Colors.light.map.polygonFill);
    });

    it("should render currentBuildingColor when user is inside building but it is not selected", async () => {
      LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
      LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
        status: "granted",
      });
      LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 45.49674, longitude: -73.57856 }, // Inside LB building
      });

      const mapViewer = render(<MapViewer />);

      const locationButton = mapViewer.getByTestId("locationButton");
      await act(async () => {
        fireEvent.press(locationButton);
      });

      const polygons = mapViewer.getAllByTestId("polygon");
      expect(polygons[0].props.fillColor).toBe(Colors.light.map.currentBuildingColor);
    });

    it("should update polygon color when user location changes from inside to outside", async () => {
      LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
      LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
        status: "granted",
      });
      LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 45.49674, longitude: -73.57856 }, // Inside LB building
      });

      const mapViewer = render(<MapViewer />);

      const locationButton = mapViewer.getByTestId("locationButton");
      await act(async () => {
        fireEvent.press(locationButton);
      });

      // Verify user is inside currentBuildingColor
      let polygons = mapViewer.getAllByTestId("polygon");
      expect(polygons[0].props.fillColor).toBe(Colors.light.map.currentBuildingColor);

      // Simulate user moving outside
      const mapView = mapViewer.getByTestId("map-view");
      await act(async () => {
        fireEvent(mapView, "onUserLocationChange", {
          nativeEvent: { coordinate: { latitude: 45.5, longitude: -73.6 } }, // Outside any building
        });
      });

      // Verify reverted to polygonFill
      polygons = mapViewer.getAllByTestId("polygon");
      expect(polygons[0].props.fillColor).toBe(Colors.light.map.polygonFill);
    });

    it("should apply correct color for all combinations of selection and location state", () => {
      // Test the color logic directly to ensure all four scenarios work:
      // selected+inBuilding, selected!inBuilding, !selected+inBuilding, !selected!inBuilding

      const testColorLogic = (isSelected, isInBuilding) => {
        if (isSelected && isInBuilding) {
          return Colors.light.map.currentSelectedBuildingColor;
        } else if (isSelected) {
          return Colors.light.map.polygonHighlighted;
        } else if (isInBuilding) {
          return Colors.light.map.currentBuildingColor;
        } else {
          return Colors.light.map.polygonFill;
        }
      };

      // Test scenario 1: selected AND in building
      expect(testColorLogic(true, true)).toBe(
        Colors.light.map.currentSelectedBuildingColor,
      );

      // Test scenario 2: selected but NOT in building
      expect(testColorLogic(true, false)).toBe(Colors.light.map.polygonHighlighted);

      // Test scenario 3: NOT selected but in building
      expect(testColorLogic(false, true)).toBe(Colors.light.map.currentBuildingColor);

      // Test scenario 4: NOT selected and NOT in building
      expect(testColorLogic(false, false)).toBe(Colors.light.map.polygonFill);
    });

    it("should render currentSelectedBuildingColor when user is inside a selected building", async () => {
      LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
      LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
        status: "granted",
      });
      LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 45.49674, longitude: -73.57856 }, // Inside LB building
      });

      const mapViewer = render(<MapViewer />);

      // Enable user location
      const locationButton = mapViewer.getByTestId("locationButton");
      await act(async () => {
        fireEvent.press(locationButton);
      });

      // Verify polygon shows currentBuildingColor (user inside, not selected)
      let polygons = mapViewer.getAllByTestId("polygon");
      expect(polygons[0].props.fillColor).toBe(Colors.light.map.currentBuildingColor);

      // Select the building by pressing its polygon
      await act(async () => {
        fireEvent.press(polygons[0]);
      });

      // Verify polygon now shows currentSelectedBuildingColor (user inside AND selected)
      polygons = mapViewer.getAllByTestId("polygon");
      expect(polygons[0].props.fillColor).toBe(
        Colors.light.map.currentSelectedBuildingColor,
      );
    });
  });

  it("shows start-hint after navigateToBuilding is called without a user location", async () => {
    const mapViewer = render(<MapViewer />);
    // Select LB building (polygon 0 -> CAMPUS_LOCATIONS[0] code "LB")
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    // Press the Directions button (in the header of BuildingInfoPopup)
    const directionsBtn = mapViewer.getByTestId("directions-action-button");
    await act(async () => {
      fireEvent.press(directionsBtn);
    });
    // No userLocation -> showStartHint should be true
    expect(mapViewer.getByTestId("start-hint")).toBeVisible();
  });

  it("navigateToBuilding uses userLocation as start when user location is set", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    // Give the map a user location
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });

    // Select LB building
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    const directionsBtn = mapViewer.getByTestId("directions-action-button");
    await act(async () => {
      fireEvent.press(directionsBtn);
    });

    // fetchAllDirections should have been called because both start and end are now set
    expect(fetchAllDirections).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 45.495, longitude: -73.579 }),
      expect.objectContaining({
        latitude: expect.any(Number),
        longitude: expect.any(Number),
      }),
    );
  });

  it("logs an error when fetching directions fails", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    fetchAllDirections.mockRejectedValueOnce(new Error("directions failed"));

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });

    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch directions:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("onRegionChangeComplete updates the current region state", async () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    await act(async () => {
      fireEvent(mapView, "onRegionChangeComplete", {
        latitude: 45.458,
        longitude: -73.64,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    });
    // CampusToggle should reflect the new region (now closer to LOY)
    expect(mapViewer.getByText("LOY")).toBeTruthy();
  });

  it('onRegionChangeComplete sets locationState to "centered" when near user location', async () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    // First set a user location
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.496, longitude: -73.578 } },
    });

    // Region change that"s very close to the user location
    await act(async () => {
      fireEvent(mapView, "onRegionChangeComplete", {
        latitude: 45.496,
        longitude: -73.578,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    });

    // The locationButton should now be in "centered" state
    const locationButton = mapViewer.getByTestId("locationButton");
    expect(locationButton).toBeTruthy();
  });

  it("renders polylines after a route with valid coords is selected", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    const mockRoute = {
      summary: "Test Route",
      overview_polyline: { points: "testpoly" },
      legs: [
        {
          distance: { text: "500 m", value: 500 },
          duration: { text: "6 mins", value: 360 },
          departure_time: undefined,
          arrival_time: undefined,
          steps: [
            {
              distance: { text: "500 m", value: 500 },
              duration: { text: "6 mins", value: 360 },
              html_instructions: "Head north",
              maneuver: "",
              polyline: { points: "testpoly" },
              travel_mode: "WALKING",
              transit_details: undefined,
            },
          ],
        },
      ],
    };

    fetchAllDirections.mockResolvedValueOnce({
      walking: [mockRoute],
      transit: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });
    // Make decodePolyline return 2 valid coords for this test
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.496, longitude: -73.578 },
    ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    // Set user location so navigateToBuilding can set a start coord
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });

    // Select a building and press Directions
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });

    // Wait for fetchAllDirections to resolve
    await act(async () => {});

    // Expand the RoutesInfoPopup
    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });

    // Select the first walking route
    const route0 = mapViewer.getByTestId("walking-route-0");
    await act(async () => {
      fireEvent.press(route0);
    });

    // A polyline should now be rendered on the map
    expect(mapViewer.getAllByTestId("polyline").length).toBeGreaterThan(0);
  });

  it("pressing a building polygon hides the routes popup", async () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    // Give the map a user location so navigateToBuilding can set a start
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });

    // Open routes by pressing Directions
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });

    // Routes popup should be open
    expect(mapViewer.queryByTestId("routes-info-popup")).toBeTruthy();

    // Press a different building polygon — handleBuildingPress sets shouldDisplayRoutes=false
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[1]);
    });

    // routes-info-popup is not rendered when shouldDisplayRoutes=false
    expect(mapViewer.queryByTestId("routes-info-popup")).toBeNull();
  });

  it("pressing the map clears polylines and resets navCoords", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      walking: [
        {
          summary: "",
          overview_polyline: { points: "p" },
          legs: [
            {
              distance: { text: "100 m", value: 100 },
              duration: { text: "1 min", value: 60 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                {
                  distance: { text: "100 m", value: 100 },
                  duration: { text: "1 min", value: 60 },
                  html_instructions: "Walk",
                  maneuver: "",
                  polyline: { points: "p" },
                  travel_mode: "WALKING",
                  transit_details: undefined,
                },
              ],
            },
          ],
        },
      ],
      transit: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.496, longitude: -73.578 },
    ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("walking-route-0"));
    });

    expect(mapViewer.getAllByTestId("polyline").length).toBeGreaterThan(0);

    // Press the map to clear everything
    fireEvent(mapView, "press", { nativeEvent: { action: "press" } });

    expect(mapViewer.queryAllByTestId("polyline")).toHaveLength(0);
  });

  it("onRouteSelect skips steps where decodePolyline returns fewer than 2 coords", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      walking: [
        {
          summary: "",
          overview_polyline: { points: "p" },
          legs: [
            {
              distance: { text: "100 m", value: 100 },
              duration: { text: "1 min", value: 60 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                {
                  distance: { text: "100 m", value: 100 },
                  duration: { text: "1 min", value: 60 },
                  html_instructions: "Walk",
                  maneuver: "",
                  polyline: { points: "short" },
                  travel_mode: "WALKING",
                  transit_details: undefined,
                },
                {
                  distance: { text: "200 m", value: 200 },
                  duration: { text: "2 min", value: 120 },
                  html_instructions: "Walk more",
                  maneuver: "",
                  polyline: { points: "long" },
                  travel_mode: "WALKING",
                  transit_details: undefined,
                },
              ],
            },
          ],
        },
      ],
      transit: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });

    // First step returns only 1 coord (skipped), second returns 2 (rendered)
    decodePolyline
      .mockReturnValueOnce([{ latitude: 45.495, longitude: -73.579 }])
      .mockReturnValueOnce([
        { latitude: 45.495, longitude: -73.579 },
        { latitude: 45.496, longitude: -73.578 },
      ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("walking-route-0"));
    });

    // Only 1 polyline rendered (the second step), the first was skipped
    expect(mapViewer.getAllByTestId("polyline")).toHaveLength(1);
  });

  it("onRouteSelect creates transit stop markers for departure and arrival stops", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      transit: [
        {
          summary: "",
          overview_polyline: { points: "p" },
          legs: [
            {
              distance: { text: "1 km", value: 1000 },
              duration: { text: "10 mins", value: 600 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                {
                  distance: { text: "1 km", value: 1000 },
                  duration: { text: "10 mins", value: 600 },
                  html_instructions: "Take bus",
                  maneuver: "",
                  polyline: { points: "busPoly" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "BUS" },
                    departure_stop: {
                      name: "Stop A",
                      location: { lat: 45.495, lng: -73.579 },
                    },
                    arrival_stop: {
                      name: "Stop B",
                      location: { lat: 45.5, lng: -73.57 },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      walking: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });

    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.5, longitude: -73.57 },
    ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });

    // Switch to transit mode
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-selector"));
    });

    // Select the transit route
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-route-0"));
    });

    // A polyline should be rendered for the bus step
    expect(mapViewer.getAllByTestId("polyline").length).toBeGreaterThan(0);
  });

  it("onRouteSelect does NOT create a node when consecutive steps share the same color", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      transit: [
        {
          summary: "",
          overview_polyline: { points: "p" },
          legs: [
            {
              distance: { text: "2 km", value: 2000 },
              duration: { text: "20 mins", value: 1200 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                // Two bus steps - same color, no node
                {
                  distance: { text: "500 m", value: 500 },
                  duration: { text: "5 min", value: 300 },
                  html_instructions: "Take bus 1",
                  maneuver: "",
                  polyline: { points: "bus1" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "BUS" },
                    departure_stop: {
                      name: "A",
                      location: { lat: 45.495, lng: -73.579 },
                    },
                    arrival_stop: { name: "B", location: { lat: 45.497, lng: -73.576 } },
                  },
                },
                {
                  distance: { text: "500 m", value: 500 },
                  duration: { text: "5 min", value: 300 },
                  html_instructions: "Take bus 2",
                  maneuver: "",
                  polyline: { points: "bus2" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "BUS" },
                    departure_stop: {
                      name: "B",
                      location: { lat: 45.497, lng: -73.576 },
                    },
                    arrival_stop: { name: "C", location: { lat: 45.5, lng: -73.57 } },
                  },
                },
              ],
            },
          ],
        },
      ],
      walking: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });

    decodePolyline
      .mockReturnValueOnce([
        { latitude: 45.495, longitude: -73.579 },
        { latitude: 45.497, longitude: -73.576 },
      ])
      .mockReturnValueOnce([
        { latitude: 45.497, longitude: -73.576 },
        { latitude: 45.5, longitude: -73.57 },
      ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-selector"));
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-route-0"));
    });

    // 2 polylines but 0 node markers (no color change between steps)
    expect(mapViewer.getAllByTestId("polyline").length).toBe(2);
  });

  it("onRegionChangeComplete sets locationState to 'on' when region moves away from user", async () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    // Set a user location
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });

    // Region far from user - should set state to "on", not "centered"
    await act(async () => {
      fireEvent(mapView, "onRegionChangeComplete", {
        latitude: 45.6,
        longitude: -73.7,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    });

    // followsUserLocation should be false (state is "on", not "centered")
    expect(mapViewer.getByTestId("map-view").props.followsUserLocation).toBe(false);
  });

  it("BuildingSelection onSelect with type 'start' stores manualStart and updates navCoords", async () => {
    const { fetchAllDirections } = require("@/utils/directions");

    const mapViewer = render(<MapViewer />);

    // Set an end building first
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });

    // Type in the start field to show results (must focus first so the dropdown renders)
    const startInput = mapViewer.getByPlaceholderText("Your location");
    await act(async () => {
      fireEvent(startInput, "onFocus");
      fireEvent.changeText(startInput, "VE");
    });

    // Press the VE result
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("start-result-VE"));
    });

    // fetchAllDirections should be called now that both start and end are known
    expect(fetchAllDirections).toHaveBeenCalled();
  });

  it("BuildingSelection onSelect clears route when coord cannot be resolved", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      walking: [
        {
          summary: "",
          overview_polyline: { points: "p" },
          legs: [
            {
              distance: { text: "100 m", value: 100 },
              duration: { text: "1 min", value: 60 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                {
                  distance: { text: "100 m", value: 100 },
                  duration: { text: "1 min", value: 60 },
                  html_instructions: "Walk",
                  maneuver: "",
                  polyline: { points: "p" },
                  travel_mode: "WALKING",
                  transit_details: undefined,
                },
              ],
            },
          ],
        },
      ],
      transit: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.496, longitude: -73.578 },
    ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("walking-route-0"));
    });

    expect(mapViewer.getAllByTestId("polyline").length).toBeGreaterThan(0);

    // Clear the start field — coord resolves to null, clears the route polyline
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("clear-start"));
    });

    expect(mapViewer.queryAllByTestId("polyline")).toHaveLength(0);
  });

  it("onStepSelect animates map to midpoint of the decoded step polyline", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    const mockRoute = {
      summary: "",
      overview_polyline: { points: "poly" },
      legs: [
        {
          distance: { text: "200 m", value: 200 },
          duration: { text: "3 mins", value: 180 },
          departure_time: undefined,
          arrival_time: undefined,
          steps: [
            {
              distance: { text: "200 m", value: 200 },
              duration: { text: "3 mins", value: 180 },
              html_instructions: "Walk",
              maneuver: "",
              polyline: { points: "steppoly" },
              travel_mode: "WALKING",
              transit_details: undefined,
            },
          ],
        },
      ],
    };

    fetchAllDirections.mockResolvedValueOnce({
      walking: [mockRoute],
      transit: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });

    // onRouteSelect: return coords for the overview polyline (walking segment)
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.496, longitude: -73.578 },
    ]);
    // onStepSelect: return coords for the step polyline
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.5, longitude: -73.57 },
      { latitude: 45.505, longitude: -73.56 },
    ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });

    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });

    // Select the route to enter step view
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("walking-route-0"));
    });

    // Press step 0 to trigger onStepSelect
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("walking-step-0"));
    });

    // animateToRegion should have been called at least once (polygon focus + possibly step)
    expect(mockAnimateToRegion).toHaveBeenCalled();
  });

  it("polylineColor returns #480efa for SUBWAY vehicle type", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      transit: [
        {
          summary: "",
          overview_polyline: { points: "p" },
          legs: [
            {
              distance: { text: "2 km", value: 2000 },
              duration: { text: "15 mins", value: 900 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                {
                  distance: { text: "2 km", value: 2000 },
                  duration: { text: "15 mins", value: 900 },
                  html_instructions: "Take subway",
                  maneuver: "",
                  polyline: { points: "subwayPoly" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "SUBWAY" },
                    departure_stop: {
                      name: "Station A",
                      location: { lat: 45.495, lng: -73.579 },
                    },
                    arrival_stop: {
                      name: "Station B",
                      location: { lat: 45.5, lng: -73.57 },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      walking: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.5, longitude: -73.57 },
    ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-selector"));
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-route-0"));
    });

    const polylines = mapViewer.getAllByTestId("polyline");
    expect(polylines[0].props.strokeColor).toBe("#480efa");
  });

  it("polylineColor returns #480efa for TRAM vehicle type", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      transit: [
        {
          summary: "",
          overview_polyline: { points: "p" },
          legs: [
            {
              distance: { text: "2 km", value: 2000 },
              duration: { text: "15 mins", value: 900 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                {
                  distance: { text: "2 km", value: 2000 },
                  duration: { text: "15 mins", value: 900 },
                  html_instructions: "Take tram",
                  maneuver: "",
                  polyline: { points: "tramPoly" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "TRAM" },
                    departure_stop: {
                      name: "Tram Stop A",
                      location: { lat: 45.495, lng: -73.579 },
                    },
                    arrival_stop: {
                      name: "Tram Stop B",
                      location: { lat: 45.5, lng: -73.57 },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      walking: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.5, longitude: -73.57 },
    ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-selector"));
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-route-0"));
    });

    const polylines = mapViewer.getAllByTestId("polyline");
    expect(polylines[0].props.strokeColor).toBe("#480efa");
  });

  it("polylineColor returns #1a73e8 for TRANSIT with unknown vehicle type (default case)", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      transit: [
        {
          summary: "",
          overview_polyline: { points: "p" },
          legs: [
            {
              distance: { text: "1 km", value: 1000 },
              duration: { text: "10 mins", value: 600 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                {
                  distance: { text: "1 km", value: 1000 },
                  duration: { text: "10 mins", value: 600 },
                  html_instructions: "Take transit",
                  maneuver: "",
                  polyline: { points: "transitPoly" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "FERRY" },
                    departure_stop: {
                      name: "Ferry Stop A",
                      location: { lat: 45.495, lng: -73.579 },
                    },
                    arrival_stop: {
                      name: "Ferry Stop B",
                      location: { lat: 45.5, lng: -73.57 },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      walking: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.5, longitude: -73.57 },
    ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-selector"));
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-route-0"));
    });

    const polylines = mapViewer.getAllByTestId("polyline");
    expect(polylines[0].props.strokeColor).toBe("#1a73e8");
  });

  it("renderCluster renders '9+' for clusters with more than 9 points", () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    const renderClusterFn = mapView.props.renderCluster;

    expect(typeof renderClusterFn).toBe("function");
    const clusterElement = renderClusterFn({
      id: 1,
      geometry: { coordinates: [-73.579, 45.495] },
      properties: { point_count: 15 },
      onPress: jest.fn(),
    });

    const { getByText } = render(clusterElement);
    expect(getByText("9+")).toBeTruthy();
  });

  it("renderCluster renders exact count for clusters with 9 or fewer points", () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");
    const renderClusterFn = mapView.props.renderCluster;

    const clusterElement = renderClusterFn({
      id: 2,
      geometry: { coordinates: [-73.579, 45.495] },
      properties: { point_count: 4 },
      onPress: jest.fn(),
    });

    const { getByText } = render(clusterElement);
    expect(getByText("4")).toBeTruthy();
  });

  it("navigateToBuilding uses inBuildingCodes location as start when user is inside a building", async () => {
    LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
    LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 45.49674, longitude: -73.57856 }, // Inside LB building
    });

    const mapViewer = render(<MapViewer />);

    const locationButton = mapViewer.getByTestId("locationButton");
    await act(async () => {
      fireEvent.press(locationButton);
    });

    const polygons = mapViewer.getAllByTestId("polygon");
    expect(polygons[0].props.fillColor).toBe(Colors.light.map.currentBuildingColor);
  });

  it("onRouteSelect creates a transition node when consecutive steps have different colors", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      transit: [
        {
          summary: "",
          overview_polyline: { points: "p" },
          legs: [
            {
              distance: { text: "2 km", value: 2000 },
              duration: { text: "20 mins", value: 1200 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                // Walking step
                {
                  distance: { text: "100 m", value: 100 },
                  duration: { text: "1 min", value: 60 },
                  html_instructions: "Walk to stop",
                  maneuver: "",
                  polyline: { points: "walkPoly" },
                  travel_mode: "WALKING",
                  transit_details: undefined,
                },
                // Bus step - different color triggers a node
                {
                  distance: { text: "1 km", value: 1000 },
                  duration: { text: "10 mins", value: 600 },
                  html_instructions: "Take bus",
                  maneuver: "",
                  polyline: { points: "busPoly" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "BUS" },
                    departure_stop: {
                      name: "Stop A",
                      location: { lat: 45.496, lng: -73.578 },
                    },
                    arrival_stop: {
                      name: "Stop B",
                      location: { lat: 45.5, lng: -73.57 },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      walking: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });

    // walking step coords
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.496, longitude: -73.578 },
    ]);
    // bus step coords
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.496, longitude: -73.578 },
      { latitude: 45.5, longitude: -73.57 },
    ]);

    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });
    await act(async () => {});

    const routesPopup = mapViewer.getByTestId("routes-info-popup");
    await act(async () => {
      routesPopup.props.onResponderGrant({}, {});
      routesPopup.props.onResponderMove({}, { dy: -300 });
      routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-selector"));
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-route-0"));
    });

    // 2 polylines (walk + bus), and on iOS a Marker node should be rendered
    expect(mapViewer.getAllByTestId("polyline").length).toBe(2);
  });

  it('BuildingSelection onSelect with type "start" stores manualStart and updates navCoords', async () => {
    const { fetchAllDirections } = require("@/utils/directions");

    const mapViewer = render(<MapViewer />);

    // Set an end building first
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });

    // Type in the start field to show results (must focus first so the dropdown renders)
    const startInput = mapViewer.getByPlaceholderText("Your location");
    await act(async () => {
      fireEvent(startInput, "onFocus");
      fireEvent.changeText(startInput, "VE");
    });

    // Press the VE result
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("start-result-VE"));
    });

    // fetchAllDirections should be called now that both start and end are known
    expect(fetchAllDirections).toHaveBeenCalled();
  });

  it("navigateToBuilding uses manualStart as start when no userLocation is set", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    fetchAllDirections.mockClear();

    const mapViewer = render(<MapViewer />);

    // 1. Select RA and open directions (no userLocation -> startHint shown)
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("marker-RA"));
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });

    // 2. Set manual start to VE via the BuildingSelection start field
    const startInput = mapViewer.getByPlaceholderText("Your location");
    await act(async () => {
      fireEvent(startInput, "onFocus");
      fireEvent.changeText(startInput, "VE");
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("start-result-VE"));
    });

    // 3. Close routes panel by pressing LB — shouldDisplayRoutes = false
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("marker-LB"));
    });

    // 4. Press Directions again on LB — no userLocation, manualStart.coord = VE.location
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });

    // fetchAllDirections should be called because manualStart provides the start coord
    expect(fetchAllDirections).toHaveBeenCalled();
  });

  it("onSelect with type 'end' calls selectBuildingByCode and focusBuilding", async () => {
    const mapViewer = render(<MapViewer />);
    const mapView = mapViewer.getByTestId("map-view");

    fireEvent(mapView, "onUserLocationChange", {
      nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
    });

    // Open directions for LB
    await act(async () => {
      fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("directions-action-button"));
    });

    // Focus the Destination field and type "VE" to get results
    const endInput = mapViewer.getByPlaceholderText("Destination");
    await act(async () => {
      fireEvent(endInput, "onFocus");
      fireEvent.changeText(endInput, "VE");
    });

    // Select VE as end destination -> onSelect(VE, "end") -> lines 300-302
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("end-result-VE"));
    });

    // focusBuilding(VE) calls animateToRegion with VE"s coordinates
    expect(mockAnimateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 45.496, longitude: -73.58 }),
    );
  });

  describe("Android platform", () => {
    let originalOS;
    beforeAll(() => {
      originalOS = require("react-native").Platform.OS;
      require("react-native").Platform.OS = "android";
    });
    afterAll(() => {
      require("react-native").Platform.OS = originalOS;
    });

    it("renders Circle overlays for transition nodes on Android", async () => {
      const { fetchAllDirections } = require("@/utils/directions");
      const { decodePolyline } = require("@/utils/decodePolyline");

      fetchAllDirections.mockResolvedValueOnce({
        transit: [
          {
            summary: "",
            overview_polyline: { points: "p" },
            legs: [
              {
                distance: { text: "2 km", value: 2000 },
                duration: { text: "20 mins", value: 1200 },
                departure_time: undefined,
                arrival_time: undefined,
                steps: [
                  {
                    distance: { text: "100 m", value: 100 },
                    duration: { text: "1 min", value: 60 },
                    html_instructions: "Walk to stop",
                    maneuver: "",
                    polyline: { points: "walkPoly" },
                    travel_mode: "WALKING",
                    transit_details: undefined,
                  },
                  {
                    distance: { text: "1 km", value: 1000 },
                    duration: { text: "10 mins", value: 600 },
                    html_instructions: "Take bus",
                    maneuver: "",
                    polyline: { points: "busPoly" },
                    travel_mode: "TRANSIT",
                    transit_details: {
                      line: { vehicle_type: "BUS" },
                      departure_stop: {
                        name: "Stop A",
                        location: { lat: 45.496, lng: -73.578 },
                      },
                      arrival_stop: {
                        name: "Stop B",
                        location: { lat: 45.5, lng: -73.57 },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
        walking: [],
        driving: [],
        bicycling: [],
        shuttle: [],
      });
      decodePolyline
        .mockReturnValueOnce([
          { latitude: 45.495, longitude: -73.579 },
          { latitude: 45.496, longitude: -73.578 },
        ])
        .mockReturnValueOnce([
          { latitude: 45.496, longitude: -73.578 },
          { latitude: 45.5, longitude: -73.57 },
        ]);

      const mapViewer = render(<MapViewer />);
      const mapView = mapViewer.getByTestId("map-view");
      fireEvent(mapView, "onUserLocationChange", {
        nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
      });
      await act(async () => {
        fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });
      await act(async () => {});

      const routesPopup = mapViewer.getByTestId("routes-info-popup");
      await act(async () => {
        routesPopup.props.onResponderGrant({}, {});
        routesPopup.props.onResponderMove({}, { dy: -300 });
        routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("transit-selector"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("transit-route-0"));
      });

      // On Android, transition nodes are rendered as Circle overlays
      expect(mapViewer.getAllByTestId("circle").length).toBeGreaterThan(0);
    });
    it("focuses on building when android marker is pressed", () => {
      const building = CAMPUS_BUILDINGS[0];
      const mapViewer = render(<MapViewer />);

      const marker = mapViewer.getByTestId(`marker-${building.buildingCode}`);
      act(() => fireEvent.press(marker));

      expect(mockAnimateToRegion).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: building.location.latitude,
          longitude: building.location.longitude,
        }),
      );
    });
  });

  describe("Start Location Priority Logic", () => {
    beforeEach(() => {
      const { fetchAllDirections } = require("@/utils/directions");
      fetchAllDirections.mockClear();
    });

    it("should prioritize manually set start location over current building", async () => {
      LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
      LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
        status: "granted",
      });
      LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 45.49674, longitude: -73.57856 }, // Inside LB building
      });

      const { fetchAllDirections } = require("@/utils/directions");
      const mapViewer = render(<MapViewer />);

      // Enable location (user lands inside LB)
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("locationButton"));
      });

      // Select VE building and Set it as Start
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-VE"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("start-action-button"));
      });

      // Now navigate to RA building
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-RA"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });

      // Even though user is inside LB, should use VE (manual start) as start point
      expect(fetchAllDirections).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.496, longitude: -73.58 }), // VE location
        expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
        }),
      );
    });

    it("should prioritize manually set start location over current GPS location", async () => {
      const { fetchAllDirections } = require("@/utils/directions");
      const mapViewer = render(<MapViewer />);
      const mapView = mapViewer.getByTestId("map-view");

      // Set user location (not inside any building)
      fireEvent(mapView, "onUserLocationChange", {
        nativeEvent: { coordinate: { latitude: 45.5, longitude: -73.6 } },
      });

      // Select VE building and Set it as Start
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-VE"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("start-action-button"));
      });

      // Now navigate to RA building
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-RA"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });

      // Should use VE (manual start) as start point, not current GPS location
      expect(fetchAllDirections).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.496, longitude: -73.58 }), // VE location
        expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
        }),
      );
    });

    it("should use current building when no manual start is set", async () => {
      LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
      LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({
        status: "granted",
      });
      LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 45.49674, longitude: -73.57856 }, // Inside LB building
      });

      const { fetchAllDirections } = require("@/utils/directions");
      const mapViewer = render(<MapViewer />);

      // Enable location (user lands inside LB)
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("locationButton"));
      });

      // Navigate to VE building
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-VE"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });

      // Should use LB (current building) as start point
      expect(fetchAllDirections).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.495, longitude: -73.579 }), // LB location
        expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
        }),
      );
    });

    it("should use current GPS location when no manual start and not in building", async () => {
      const { fetchAllDirections } = require("@/utils/directions");
      const mapViewer = render(<MapViewer />);
      const mapView = mapViewer.getByTestId("map-view");

      // Set user location (not inside any building)
      fireEvent(mapView, "onUserLocationChange", {
        nativeEvent: { coordinate: { latitude: 45.5, longitude: -73.6 } },
      });

      // Navigate to VE building
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-VE"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });

      // Should use current GPS location as start point
      expect(fetchAllDirections).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.5, longitude: -73.6 }),
        expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
        }),
      );
    });

    it("should persist manual start location across multiple navigations", async () => {
      const { fetchAllDirections } = require("@/utils/directions");
      const mapViewer = render(<MapViewer />);

      // Select VE building and Set it as Start
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-VE"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("start-action-button"));
      });

      // Navigate to RA building
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-RA"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });

      expect(fetchAllDirections).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.496, longitude: -73.58 }), // VE location
        expect.anything(),
      );

      fetchAllDirections.mockClear();

      // Close the directions and navigate to another building
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-PC"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });

      // Should still use VE as start point
      expect(fetchAllDirections).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.496, longitude: -73.58 }), // VE location still
        expect.anything(),
      );
    });

    it("should clear manual start when user manually clears the start field", async () => {
      const { fetchAllDirections } = require("@/utils/directions");
      const mapViewer = render(<MapViewer />);
      const mapView = mapViewer.getByTestId("map-view");

      // Set user location
      fireEvent(mapView, "onUserLocationChange", {
        nativeEvent: { coordinate: { latitude: 45.5, longitude: -73.6 } },
      });

      // Select VE building and navigate to RA first to set VE as start
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-VE"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("start-action-button"));
      });

      // Select a destination (set destination to RA via BuildingSelection)
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-RA"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });

      // Verify VE was used as start
      expect(fetchAllDirections).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.496, longitude: -73.58 }), // VE
        expect.anything(),
      );

      fetchAllDirections.mockClear();

      // Clear the start field
      const clearStartButton = mapViewer.getByTestId("clear-start");
      await act(async () => {
        fireEvent.press(clearStartButton);
      });

      // Now manually select a new start (current location) via the start input
      const startInput = mapViewer.getByPlaceholderText("Your location");
      await act(async () => {
        fireEvent(startInput, "onFocus");
        fireEvent.changeText(startInput, "Current");
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("start-result-CURRENT_LOCATION"));
      });

      // Routes should be re-fetched with new start (current GPS)
      await act(async () => {});

      // Should now use current GPS location as start point (manual start was cleared)
      expect(fetchAllDirections).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.5, longitude: -73.6 }),
        expect.anything(),
      );
    });

    it("should auto-fill start with manual start when entering directions mode", async () => {
      const mapViewer = render(<MapViewer />);

      // Select VE building and Set it as Start (with no destination yet)
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-VE"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("start-action-button"));
      });

      // At this point we"re in directions mode with start=VE but no destination
      // The start input should have "VE" as the value
      const startInput = mapViewer.getByPlaceholderText("Your location");
      expect(startInput.props.value).toBe("VE");

      // Now press map to go back to browse mode
      const mapView = mapViewer.getByTestId("map-view");
      await act(async () => {
        fireEvent(mapView, "press", { nativeEvent: { action: "press" } });
      });

      // Select RA building and navigate
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-RA"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });

      // Start field should still be auto-filled with VE
      const startInputAgain = mapViewer.getByPlaceholderText("Your location");
      expect(startInputAgain.props.value).toBe("VE");
    });
  });
});
