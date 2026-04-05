import React from "react";
import { act, render, fireEvent, waitFor } from "@testing-library/react-native";
import * as LocationPermissions from "expo-location";
import MapViewer from "../components/map/map-viewer";
import { Colors } from "@/constants/theme";
import { CAMPUS_BUILDINGS } from "../constants/map";
import { OutdoorStepResume } from "@/globals/OutdoorStepResumeStore";
import { fetchAllDirections } from "@/utils/directions";
import * as SearchBuildingHook from "@/hooks/use-search-building";
import { usePoi } from "@/hooks/use-poi";
import { useLocalSearchParams, router } from "expo-router";
import { Platform } from "react-native";
const mockAnimateToRegion = jest.fn();
let latestFocusEffect = null;

const MOCK_POI = {
  place_id: "poi-1",
  name: "Test POI",
  types: ["restaurant"],
  geometry: {
    location: {
      lat: 45.495,
      lng: -73.579,
    },
    viewport: {
      northeast: { lat: 45.496, lng: -73.578 },
      southwest: { lat: 45.494, lng: -73.58 },
    },
  },
};

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

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

jest.mock("@/hooks/use-poi", () => ({
  usePoi: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useFocusEffect: (effect) => {
    const React = require("react");
    latestFocusEffect = effect;
    React.useEffect(effect, [effect]);
  },
  router: {
    setParams: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
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
  OutdoorStepResume.reset();
  latestFocusEffect = null;
  useLocalSearchParams.mockReturnValue({});
  usePoi.mockReturnValue([]);
  router.setParams.mockClear();
  router.push.mockClear();
  router.back.mockClear();
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

  it("updates radius when slider interaction completes", () => {
    const mapViewer = render(<MapViewer />);

    const settingsButton = mapViewer.getByTestId("outdoor-settings-button");
    act(() => {
      fireEvent.press(settingsButton);
    });

    expect(mapViewer.getByTestId("outdoor-settings-panel")).toBeTruthy();
    expect(mapViewer.getAllByText("0 m").length).toBeGreaterThan(0);

    const slider = mapViewer.getByTestId("radius-slider");
    act(() => {
      fireEvent(slider, "onSlidingComplete", 760);
    });

    expect(mapViewer.getByText("760 m")).toBeTruthy();
  });

  it("opens the POI popup when pressing a filtered place proxy", () => {
    const originalPlatformOS = Platform.OS;
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "android",
    });

    usePoi.mockReturnValue([MOCK_POI]);

    try {
      const mapViewer = render(<MapViewer />);

      expect(mapViewer.getByTestId("marker-poi-1")).toBeTruthy();

      fireEvent.press(mapViewer.getByTestId("marker-poi-1"));

      expect(mapViewer.getByTestId("poi-info-popup")).toBeTruthy();
      expect(mapViewer.getByText("Test POI")).toBeTruthy();
    } finally {
      Object.defineProperty(Platform, "OS", {
        configurable: true,
        value: originalPlatformOS,
      });
    }
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
    expect(mapViewer.queryByTestId("radius-slider")).toBeNull();

    expect(router.setParams).toHaveBeenCalledWith({
      buildingId: "",
      buildingName: "",
      autoNavigate: "",
      destinationRoom: "",
    });
  });

  it("keeps browse mode when opened with buildingId only", async () => {
    useLocalSearchParams.mockReturnValue({
      buildingId: "LB",
    });

    const mapViewer = render(<MapViewer />);

    expect(mapViewer.queryByTestId("building-info-popup")).toBeTruthy();
    expect(mapViewer.queryByTestId("routes-info-popup")).toBeNull();
    expect(mapViewer.queryByTestId("radius-slider")).toBeNull();
    expect(router.setParams).toHaveBeenCalledWith({
      buildingId: "",
      buildingName: "",
      autoNavigate: "",
      destinationRoom: "",
    });
  });

  it("uses the destination room from auto-navigate params when provided", async () => {
    const hybridNavigation = require("@/utils/hybridNavigation");
    const enrichSpy = jest
      .spyOn(hybridNavigation, "enrichRoutesWithIndoorTransitions")
      .mockImplementation(async (routes) => routes);

    fetchAllDirections.mockResolvedValue({
      walking: [],
      transit: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });

    useLocalSearchParams.mockReturnValue({
      buildingId: "VE",
      autoNavigate: "true",
      destinationRoom: "VE101",
    });

    try {
      const mapViewer = render(<MapViewer />);
      const mapView = mapViewer.getByTestId("map-view");

      await act(async () => {
        fireEvent(mapView, "onUserLocationChange", {
          nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
        });
      });

      await waitFor(() => {
        expect(enrichSpy).toHaveBeenCalled();
      });

      const selections = enrichSpy.mock.calls.at(-1)?.[1];
      expect(selections?.end).toMatchObject({
        roomName: "VE101",
        parentBuildingCode: "VE",
        isIndoorRoom: true,
      });
    } finally {
      enrichSpy.mockRestore();
    }
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

  it("keeps only the latest route polyline when selecting routes before the next frame", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    const originalRaf = global.requestAnimationFrame;
    const originalCancelRaf = global.cancelAnimationFrame;
    const queuedFrames = new Map();
    let nextFrameId = 1;

    global.requestAnimationFrame = jest.fn((callback) => {
      const frameId = nextFrameId++;
      queuedFrames.set(frameId, callback);
      return frameId;
    });
    global.cancelAnimationFrame = jest.fn((frameId) => {
      queuedFrames.delete(frameId);
    });

    try {
      const routeA = {
        summary: "",
        overview_polyline: { points: "route-a-overview" },
        legs: [
          {
            distance: { text: "200 m", value: 200 },
            duration: { text: "3 mins", value: 180 },
            steps: [
              {
                distance: { text: "200 m", value: 200 },
                duration: { text: "3 mins", value: 180 },
                html_instructions: "Route A",
                maneuver: "",
                polyline: { points: "route-a-step" },
                travel_mode: "WALKING",
              },
            ],
          },
        ],
      };
      const routeB = {
        summary: "",
        overview_polyline: { points: "route-b-overview" },
        legs: [
          {
            distance: { text: "250 m", value: 250 },
            duration: { text: "4 mins", value: 240 },
            steps: [
              {
                distance: { text: "250 m", value: 250 },
                duration: { text: "4 mins", value: 240 },
                html_instructions: "Route B",
                maneuver: "",
                polyline: { points: "route-b-step" },
                travel_mode: "WALKING",
              },
            ],
          },
        ],
      };

      fetchAllDirections.mockResolvedValueOnce({
        walking: [routeA, routeB],
        transit: [],
        driving: [],
        bicycling: [],
        shuttle: [],
      });

      const routeACoords = [
        { latitude: 45.495, longitude: -73.579 },
        { latitude: 45.496, longitude: -73.578 },
      ];
      const routeBCoords = [
        { latitude: 45.497, longitude: -73.577 },
        { latitude: 45.498, longitude: -73.576 },
      ];
      decodePolyline.mockReturnValueOnce(routeACoords).mockReturnValueOnce(routeBCoords);

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
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("back-to-routes-button"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("walking-route-1"));
      });

      const polylines = mapViewer.getAllByTestId("polyline");
      expect(polylines).toHaveLength(1);
      expect(polylines[0].props.coordinates).toEqual(routeBCoords);
    } finally {
      global.requestAnimationFrame = originalRaf;
      global.cancelAnimationFrame = originalCancelRaf;
    }
  });

  it("replaces walking polyline with transit polyline when switching modes and selecting a transit route", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      walking: [
        {
          summary: "",
          overview_polyline: { points: "walk-overview" },
          legs: [
            {
              distance: { text: "200 m", value: 200 },
              duration: { text: "3 mins", value: 180 },
              steps: [
                {
                  distance: { text: "200 m", value: 200 },
                  duration: { text: "3 mins", value: 180 },
                  html_instructions: "Walk route",
                  maneuver: "",
                  polyline: { points: "walk-step" },
                  travel_mode: "WALKING",
                },
              ],
            },
          ],
        },
      ],
      transit: [
        {
          summary: "",
          overview_polyline: { points: "transit-overview" },
          legs: [
            {
              distance: { text: "2 km", value: 2000 },
              duration: { text: "20 mins", value: 1200 },
              steps: [
                {
                  distance: { text: "100 m", value: 100 },
                  duration: { text: "2 mins", value: 120 },
                  html_instructions: "Walk to stop",
                  maneuver: "",
                  polyline: { points: "transit-walk-step" },
                  travel_mode: "WALKING",
                },
                {
                  distance: { text: "2 km", value: 2000 },
                  duration: { text: "20 mins", value: 1200 },
                  html_instructions: "Take bus",
                  maneuver: "",
                  polyline: { points: "transit-step" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "BUS" },
                    departure_stop: {
                      name: "A",
                      location: { lat: 45.495, lng: -73.579 },
                    },
                    arrival_stop: { name: "B", location: { lat: 45.5, lng: -73.57 } },
                  },
                },
              ],
            },
          ],
        },
      ],
      driving: [],
      bicycling: [],
      shuttle: [],
    });

    const walkingCoords = [
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.496, longitude: -73.578 },
    ];
    const transitCoords = [
      { latitude: 45.497, longitude: -73.577 },
      { latitude: 45.498, longitude: -73.576 },
    ];
    const transitWalkCoords = [
      { latitude: 45.496, longitude: -73.578 },
      { latitude: 45.497, longitude: -73.577 },
    ];
    decodePolyline.mockImplementation((encoded) => {
      if (encoded === "walk-step") {
        return walkingCoords;
      }
      if (encoded === "transit-walk-step") {
        return transitWalkCoords;
      }
      if (encoded === "transit-step") {
        return transitCoords;
      }
      return [];
    });

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
    await act(async () => {});
    expect(mapViewer.getAllByTestId("polyline")).toHaveLength(1);
    expect(mapViewer.getAllByTestId("polyline")[0].props.coordinates).toEqual(
      walkingCoords,
    );

    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-selector"));
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-route-0"));
    });
    await act(async () => {});

    const renderedPolylines = mapViewer.getAllByTestId("polyline");
    expect(renderedPolylines).toHaveLength(2);
    expect(renderedPolylines[0].props.coordinates).toEqual(transitWalkCoords);
    expect(renderedPolylines[1].props.coordinates).toEqual(transitCoords);
    expect(renderedPolylines[0].props.coordinates).not.toEqual(walkingCoords);
  });

  it("clears the currently rendered polyline when switching transportation mode tabs", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { decodePolyline } = require("@/utils/decodePolyline");

    fetchAllDirections.mockResolvedValueOnce({
      walking: [
        {
          summary: "",
          overview_polyline: { points: "walk-overview" },
          legs: [
            {
              distance: { text: "200 m", value: 200 },
              duration: { text: "3 mins", value: 180 },
              steps: [
                {
                  distance: { text: "200 m", value: 200 },
                  duration: { text: "3 mins", value: 180 },
                  html_instructions: "Walk route",
                  maneuver: "",
                  polyline: { points: "walk-step" },
                  travel_mode: "WALKING",
                },
              ],
            },
          ],
        },
      ],
      transit: [
        {
          summary: "",
          overview_polyline: { points: "transit-overview" },
          legs: [
            {
              distance: { text: "2 km", value: 2000 },
              duration: { text: "20 mins", value: 1200 },
              steps: [
                {
                  distance: { text: "2 km", value: 2000 },
                  duration: { text: "20 mins", value: 1200 },
                  html_instructions: "Take bus",
                  maneuver: "",
                  polyline: { points: "transit-step" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "BUS" },
                    departure_stop: {
                      name: "A",
                      location: { lat: 45.495, lng: -73.579 },
                    },
                    arrival_stop: { name: "B", location: { lat: 45.5, lng: -73.57 } },
                  },
                },
              ],
            },
          ],
        },
      ],
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
    await act(async () => {});
    expect(mapViewer.getAllByTestId("polyline")).toHaveLength(1);

    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("transit-selector"));
    });

    expect(mapViewer.queryAllByTestId("polyline")).toHaveLength(0);
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

    // Same-color consecutive transit steps are coalesced into one polyline.
    expect(mapViewer.getAllByTestId("polyline").length).toBe(1);
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

  it("opens indoor map with entrance checkpoint and destination room when an indoor step is pressed", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { encodeIndoorStepPayload } = require("@/utils/hybridNavigation");

    const indoorPayload = encodeIndoorStepPayload({
      building_code: "H",
      start_checkpoint_id: "H_F2_building_entry_exit_15",
      end_room: "H110",
    });

    fetchAllDirections.mockResolvedValueOnce({
      walking: [
        {
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
                  distance: { text: "12 indoor checkpoints", value: 12 },
                  duration: { text: "Indoor segment", value: 0 },
                  html_instructions:
                    "Enter H via H2 Entry Exit 3 and continue indoors to room H110.",
                  maneuver: "",
                  polyline: { points: indoorPayload },
                  travel_mode: "INDOOR",
                  indoor_details: {
                    building_code: "H",
                    start_checkpoint_id: "H_F2_building_entry_exit_15",
                    end_room: "H110",
                  },
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
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("walking-step-0"));
    });

    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining(
        "/H?indoorStartCheckpointId=H_F2_building_entry_exit_15&indoorEndRoom=H110",
      ),
    );
  });

  it("opens indoor map with room and destination entry checkpoint when an indoor step is pressed", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { encodeIndoorStepPayload } = require("@/utils/hybridNavigation");

    const indoorPayload = encodeIndoorStepPayload({
      building_code: "H",
      start_room: "H110",
      end_checkpoint_id: "H_F2_building_entry_exit_15",
    });

    fetchAllDirections.mockResolvedValueOnce({
      walking: [
        {
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
                  distance: { text: "12 indoor checkpoints", value: 12 },
                  duration: { text: "Indoor segment", value: 0 },
                  html_instructions:
                    "Navigate indoors from room H110 to H2 Entry Exit 3 in H.",
                  maneuver: "",
                  polyline: { points: indoorPayload },
                  travel_mode: "INDOOR",
                  indoor_details: {
                    building_code: "H",
                    start_room: "H110",
                    end_checkpoint_id: "H_F2_building_entry_exit_15",
                  },
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
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("walking-step-0"));
    });

    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining(
        "/H?indoorStartRoom=H110&indoorEndCheckpointId=H_F2_building_entry_exit_15",
      ),
    );
  });

  it("stores the next outdoor step when opening an indoor-to-outdoor segment", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { encodeIndoorStepPayload } = require("@/utils/hybridNavigation");

    const indoorPayload = encodeIndoorStepPayload({
      building_code: "H",
      start_room: "H110",
      end_checkpoint_id: "H_F2_building_entry_exit_15",
    });

    fetchAllDirections.mockResolvedValueOnce({
      walking: [
        {
          summary: "",
          overview_polyline: { points: "poly" },
          legs: [
            {
              distance: { text: "240 m", value: 240 },
              duration: { text: "4 mins", value: 240 },
              departure_time: undefined,
              arrival_time: undefined,
              steps: [
                {
                  distance: { text: "12 indoor checkpoints", value: 12 },
                  duration: { text: "Indoor segment", value: 0 },
                  html_instructions:
                    "Navigate indoors from room H110 to H2 Entry Exit 3 in H.",
                  maneuver: "",
                  polyline: { points: indoorPayload },
                  travel_mode: "INDOOR",
                },
                {
                  distance: { text: "50 m", value: 50 },
                  duration: { text: "1 min", value: 60 },
                  html_instructions: "Head east on De Maisonneuve.",
                  maneuver: "straight",
                  polyline: { points: "outdoor-step-polyline" },
                  travel_mode: "WALKING",
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
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("walking-step-0"));
    });

    const pushedPath = router.push.mock.calls.at(-1)?.[0];
    expect(pushedPath).toEqual(
      expect.stringContaining("resumeContinuationId=outdoor-step-0"),
    );
    expect(OutdoorStepResume.getContinuation("outdoor-step-0")).toEqual({
      encodedPolyline: "outdoor-step-polyline",
      travelMode: "WALK",
    });
  });

  it("restores the selected route details when returning from an indoor step without a pending resume step", async () => {
    const { fetchAllDirections } = require("@/utils/directions");
    const { encodeIndoorStepPayload } = require("@/utils/hybridNavigation");

    const indoorPayload = encodeIndoorStepPayload({
      building_code: "H",
      start_room: "H110",
      end_checkpoint_id: "H_F2_building_entry_exit_15",
    });

    fetchAllDirections.mockResolvedValueOnce({
      walking: null,
      transit: null,
      driving: null,
      bicycling: null,
      shuttle: [
        {
          summary: "Concordia Shuttle",
          overview_polyline: { points: "poly" },
          legs: [
            {
              distance: { text: "5 km", value: 5000 },
              duration: { text: "25 mins", value: 1500 },
              steps: [
                {
                  distance: { text: "12 indoor checkpoints", value: 12 },
                  duration: { text: "Indoor segment", value: 0 },
                  html_instructions:
                    "Navigate indoors from room H110 to H2 Entry Exit 3 in H.",
                  maneuver: "",
                  polyline: { points: indoorPayload },
                  travel_mode: "INDOOR",
                },
                {
                  distance: { text: "4 km", value: 4000 },
                  duration: { text: "20 mins", value: 1200 },
                  html_instructions: "Take the Concordia Shuttle from SGW to Loyola",
                  maneuver: "",
                  polyline: { points: "outdoor-shuttle-step-polyline" },
                  travel_mode: "SHUTTLE",
                  transit_details: {
                    line: {
                      name: "Concordia Shuttle",
                      short_name: "Shuttle",
                      vehicle_type: "BUS",
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    });

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
      fireEvent.press(mapViewer.getByTestId("shuttle-route-0"));
    });
    await act(async () => {
      fireEvent.press(mapViewer.getByTestId("shuttle-step-0"));
    });

    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining("resumeContinuationId=outdoor-step-0"),
    );
    expect(OutdoorStepResume.getContinuation("outdoor-step-0")).toEqual({
      encodedPolyline: "outdoor-shuttle-step-polyline",
      travelMode: "SHUTTLE",
    });

    await act(async () => {
      latestFocusEffect?.();
    });

    await waitFor(() => {
      expect(mapViewer.getByTestId("routes-info-popup")).toBeTruthy();
      expect(mapViewer.getByTestId("back-to-routes-button")).toBeTruthy();
      expect(mapViewer.getByTestId("shuttle-step-0")).toBeTruthy();
    });
    expect(OutdoorStepResume.getContinuation("outdoor-step-0")).toBeNull();
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

  it("onRouteSelect creates a transition node when consecutive transit steps have different colors", async () => {
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
                // First transit step (bus)
                {
                  distance: { text: "100 m", value: 100 },
                  duration: { text: "1 min", value: 60 },
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
                      location: { lat: 45.496, lng: -73.578 },
                    },
                  },
                },
                // Second transit step (subway) - different color triggers a node
                {
                  distance: { text: "1 km", value: 1000 },
                  duration: { text: "10 mins", value: 600 },
                  html_instructions: "Take subway",
                  maneuver: "",
                  polyline: { points: "subwayPoly" },
                  travel_mode: "TRANSIT",
                  transit_details: {
                    line: { vehicle_type: "SUBWAY" },
                    departure_stop: {
                      name: "Station B",
                      location: { lat: 45.496, lng: -73.578 },
                    },
                    arrival_stop: {
                      name: "Station C",
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

    // bus step coords
    decodePolyline.mockReturnValueOnce([
      { latitude: 45.495, longitude: -73.579 },
      { latitude: 45.496, longitude: -73.578 },
    ]);
    // subway step coords
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

    // 2 transit polylines (bus + subway), and on iOS a Marker node should be rendered
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
                        location: { lat: 45.496, lng: -73.578 },
                      },
                    },
                  },
                  {
                    distance: { text: "1 km", value: 1000 },
                    duration: { text: "10 mins", value: 600 },
                    html_instructions: "Take subway",
                    maneuver: "",
                    polyline: { points: "subwayPoly" },
                    travel_mode: "TRANSIT",
                    transit_details: {
                      line: { vehicle_type: "SUBWAY" },
                      departure_stop: {
                        name: "Station B",
                        location: { lat: 45.496, lng: -73.578 },
                      },
                      arrival_stop: {
                        name: "Station C",
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

    it("renders a transition node when travel mode changes even if segment colors match", async () => {
      const { fetchAllDirections } = require("@/utils/directions");
      const { decodePolyline } = require("@/utils/decodePolyline");

      fetchAllDirections.mockResolvedValueOnce({
        transit: [
          {
            summary: "",
            overview_polyline: { points: "p" },
            legs: [
              {
                distance: { text: "900 m", value: 900 },
                duration: { text: "12 mins", value: 720 },
                departure_time: undefined,
                arrival_time: undefined,
                steps: [
                  {
                    distance: { text: "150 m", value: 150 },
                    duration: { text: "2 mins", value: 120 },
                    html_instructions: "Walk to the stop",
                    maneuver: "",
                    polyline: { points: "walkPoly" },
                    travel_mode: "WALKING",
                  },
                  {
                    distance: { text: "750 m", value: 750 },
                    duration: { text: "10 mins", value: 600 },
                    html_instructions: "Take transit",
                    maneuver: "",
                    polyline: { points: "transitPoly" },
                    travel_mode: "TRANSIT",
                    transit_details: {
                      line: {},
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

      expect(mapViewer.getAllByTestId("circle")).toHaveLength(3);
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

    it("does not reuse the previous destination after canceling directions", async () => {
      const mapViewer = render(<MapViewer />);
      const mapView = mapViewer.getByTestId("map-view");

      fireEvent(mapView, "onUserLocationChange", {
        nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
      });

      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-VE"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });

      await act(async () => {
        fireEvent(mapView, "press", { nativeEvent: { action: "press" } });
      });

      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("marker-RA"));
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("start-action-button"));
      });

      const destinationInput = mapViewer.getByPlaceholderText("Destination");
      expect(destinationInput.props.value).toBe("");
    });

    it("keeps room label when setting start from a room info popup", async () => {
      const React = require("react");
      const useBuildingSearchSpy = jest
        .spyOn(SearchBuildingHook, "useBuildingSearch")
        .mockImplementation(() => {
          const [queries, setQueries] = React.useState({ start: "", end: "" });
          const updateQuery = React.useCallback((type, text) => {
            const nextValue = text || "";
            setQueries((prev) =>
              prev[type] === nextValue
                ? prev
                : {
                    ...prev,
                    [type]: nextValue,
                  },
            );
          }, []);
          const swapQueries = React.useCallback(() => {
            setQueries((prev) => ({
              start: prev.end,
              end: prev.start,
            }));
          }, []);

          return {
            queries,
            updateQuery,
            swapQueries,
            results: {
              start: [],
              end: [
                {
                  buildingCode: "VE101",
                  buildingName: "VE101",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE101",
                  isIndoorRoom: true,
                },
              ],
            },
          };
        });

      try {
        const mapViewer = render(<MapViewer />);

        const endInput = mapViewer.getByPlaceholderText("Search building");
        await act(async () => {
          fireEvent(endInput, "onFocus");
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE101"));
        });

        await waitFor(() => {
          expect(mapViewer.getByText("VE – Room VE101")).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("start-action-button"));
        });

        await waitFor(() => {
          const startInput = mapViewer.getByPlaceholderText("Your location");
          expect(startInput.props.value).toBe("VE101");
        });
      } finally {
        useBuildingSearchSpy.mockRestore();
      }
    });

    it("opens indoor navigation directly when both directions selections are rooms in the same building", async () => {
      const React = require("react");
      fetchAllDirections.mockClear();

      const useBuildingSearchSpy = jest
        .spyOn(SearchBuildingHook, "useBuildingSearch")
        .mockImplementation(() => {
          const [queries, setQueries] = React.useState({ start: "", end: "" });
          const updateQuery = React.useCallback((type, text) => {
            const nextValue = text || "";
            setQueries((prev) =>
              prev[type] === nextValue
                ? prev
                : {
                    ...prev,
                    [type]: nextValue,
                  },
            );
          }, []);
          const swapQueries = React.useCallback(() => {
            setQueries((prev) => ({
              start: prev.end,
              end: prev.start,
            }));
          }, []);

          return {
            queries,
            updateQuery,
            swapQueries,
            results: {
              start: [
                {
                  buildingCode: "VE101",
                  buildingName: "VE101",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE101",
                  isIndoorRoom: true,
                },
              ],
              end: [
                {
                  buildingCode: "VE102",
                  buildingName: "VE102",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE102",
                  isIndoorRoom: true,
                },
              ],
            },
          };
        });

      try {
        const mapViewer = render(<MapViewer />);

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("marker-RA"));
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("directions-action-button"));
        });

        const startInput = mapViewer.getByPlaceholderText("Your location");
        await act(async () => {
          fireEvent(startInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("start-result-VE101"));
        });
        const fetchCallsBeforeEndSelection = fetchAllDirections.mock.calls.length;

        const endInput = mapViewer.getByPlaceholderText("Destination");
        await act(async () => {
          fireEvent(endInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE102"));
        });

        await waitFor(() => {
          expect(router.push).toHaveBeenCalledWith(
            expect.stringContaining("/VE?indoorStartRoom=VE101&indoorEndRoom=VE102"),
          );
        });
        expect(fetchAllDirections.mock.calls.length).toBe(fetchCallsBeforeEndSelection);
      } finally {
        useBuildingSearchSpy.mockRestore();
      }
    });

    it("resets to the selected building after opening a same-building indoor room route", async () => {
      const React = require("react");
      fetchAllDirections.mockClear();

      const useBuildingSearchSpy = jest
        .spyOn(SearchBuildingHook, "useBuildingSearch")
        .mockImplementation(() => {
          const [queries, setQueries] = React.useState({ start: "", end: "" });
          const updateQuery = React.useCallback((type, text) => {
            const nextValue = text || "";
            setQueries((prev) =>
              prev[type] === nextValue
                ? prev
                : {
                    ...prev,
                    [type]: nextValue,
                  },
            );
          }, []);
          const swapQueries = React.useCallback(() => {
            setQueries((prev) => ({
              start: prev.end,
              end: prev.start,
            }));
          }, []);

          return {
            queries,
            updateQuery,
            swapQueries,
            results: {
              start: [
                {
                  buildingCode: "VE101",
                  buildingName: "VE101",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE101",
                  isIndoorRoom: true,
                },
                {
                  buildingCode: "VE201",
                  buildingName: "VE201",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE201",
                  isIndoorRoom: true,
                },
              ],
              end: [
                {
                  buildingCode: "VE102",
                  buildingName: "VE102",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE102",
                  isIndoorRoom: true,
                },
                {
                  buildingCode: "VE202",
                  buildingName: "VE202",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE202",
                  isIndoorRoom: true,
                },
              ],
            },
          };
        });

      try {
        const mapViewer = render(<MapViewer />);

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("marker-RA"));
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("directions-action-button"));
        });

        const startInput = mapViewer.getByPlaceholderText("Your location");
        await act(async () => {
          fireEvent(startInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("start-result-VE101"));
        });

        const endInput = mapViewer.getByPlaceholderText("Destination");
        await act(async () => {
          fireEvent(endInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE102"));
        });

        await waitFor(() => {
          expect(router.push).toHaveBeenCalledWith(
            expect.stringContaining("/VE?indoorStartRoom=VE101&indoorEndRoom=VE102"),
          );
        });

        await waitFor(() => {
          expect(mapViewer.getByTestId("building-info-popup")).toBeTruthy();
          expect(mapViewer.getByPlaceholderText("Search building")).toBeTruthy();
          expect(mapViewer.queryByPlaceholderText("Your location")).toBeNull();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("directions-action-button"));
        });
        await act(async () => {
          fireEvent(mapViewer.getByPlaceholderText("Your location"), "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("start-result-VE201"));
        });
        await act(async () => {
          fireEvent(mapViewer.getByPlaceholderText("Destination"), "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE202"));
        });

        await waitFor(() => {
          expect(router.push).toHaveBeenCalledWith(
            expect.stringContaining("/VE?indoorStartRoom=VE201&indoorEndRoom=VE202"),
          );
        });
        expect(router.push).toHaveBeenCalledTimes(2);
      } finally {
        useBuildingSearchSpy.mockRestore();
      }
    });

    it("preserves room-based start context after destination selection for indoor-to-outdoor routing", async () => {
      const React = require("react");
      const useBuildingSearchSpy = jest
        .spyOn(SearchBuildingHook, "useBuildingSearch")
        .mockImplementation(() => {
          const [queries, setQueries] = React.useState({ start: "", end: "" });
          const updateQuery = React.useCallback((type, text) => {
            const nextValue = text || "";
            setQueries((prev) =>
              prev[type] === nextValue
                ? prev
                : {
                    ...prev,
                    [type]: nextValue,
                  },
            );
          }, []);
          const swapQueries = React.useCallback(() => {
            setQueries((prev) => ({
              start: prev.end,
              end: prev.start,
            }));
          }, []);

          return {
            queries,
            updateQuery,
            swapQueries,
            results: {
              start: [],
              end: [
                {
                  buildingCode: "VE101",
                  buildingName: "VE101",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE101",
                  isIndoorRoom: true,
                },
                {
                  buildingCode: "AB",
                  buildingName: "AB",
                  address: "Mock Address",
                  campus: "SGW",
                },
              ],
            },
          };
        });

      const hybridNavigation = require("@/utils/hybridNavigation");
      const enrichSpy = jest
        .spyOn(hybridNavigation, "enrichRoutesWithIndoorTransitions")
        .mockImplementation(async (routes) => routes);

      fetchAllDirections.mockResolvedValue({
        walking: [
          {
            summary: "",
            overview_polyline: { points: "poly" },
            legs: [
              {
                distance: { text: "100 m", value: 100 },
                duration: { text: "2 mins", value: 120 },
                steps: [
                  {
                    distance: { text: "100 m", value: 100 },
                    duration: { text: "2 mins", value: 120 },
                    html_instructions: "Head north",
                    polyline: { points: "abcd" },
                    travel_mode: "WALK",
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

      try {
        const mapViewer = render(<MapViewer />);

        const endInputBrowse = mapViewer.getByPlaceholderText("Search building");
        await act(async () => {
          fireEvent(endInputBrowse, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE101"));
        });

        await waitFor(() => {
          expect(mapViewer.getByText("VE – Room VE101")).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("start-action-button"));
        });

        const endInputDirections = mapViewer.getByPlaceholderText("Destination");
        await act(async () => {
          fireEvent(endInputDirections, "onFocus");
          fireEvent.changeText(endInputDirections, "AB");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-AB"));
        });

        await waitFor(() => {
          expect(enrichSpy).toHaveBeenCalled();
        });

        const selections = enrichSpy.mock.calls.at(-1)?.[1];
        expect(selections?.start).toMatchObject({
          roomName: "VE101",
          parentBuildingCode: "VE",
          isIndoorRoom: true,
        });
      } finally {
        enrichSpy.mockRestore();
        useBuildingSearchSpy.mockRestore();
      }
    });

    it("reuses saved room-start context when routing again from browse mode", async () => {
      const React = require("react");
      const useBuildingSearchSpy = jest
        .spyOn(SearchBuildingHook, "useBuildingSearch")
        .mockImplementation(() => {
          const [queries, setQueries] = React.useState({ start: "", end: "" });
          const updateQuery = React.useCallback((type, text) => {
            const nextValue = text || "";
            setQueries((prev) =>
              prev[type] === nextValue
                ? prev
                : {
                    ...prev,
                    [type]: nextValue,
                  },
            );
          }, []);
          const swapQueries = React.useCallback(() => {
            setQueries((prev) => ({
              start: prev.end,
              end: prev.start,
            }));
          }, []);

          return {
            queries,
            updateQuery,
            swapQueries,
            results: {
              start: [],
              end: [
                {
                  buildingCode: "VE101",
                  buildingName: "VE101",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE101",
                  isIndoorRoom: true,
                },
              ],
            },
          };
        });

      const hybridNavigation = require("@/utils/hybridNavigation");
      const enrichSpy = jest
        .spyOn(hybridNavigation, "enrichRoutesWithIndoorTransitions")
        .mockImplementation(async (routes) => routes);

      fetchAllDirections.mockResolvedValue({
        walking: [
          {
            summary: "",
            overview_polyline: { points: "poly" },
            legs: [
              {
                distance: { text: "100 m", value: 100 },
                duration: { text: "2 mins", value: 120 },
                steps: [
                  {
                    distance: { text: "100 m", value: 100 },
                    duration: { text: "2 mins", value: 120 },
                    html_instructions: "Head north",
                    polyline: { points: "abcd" },
                    travel_mode: "WALK",
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

      try {
        const mapViewer = render(<MapViewer />);

        const endInputBrowse = mapViewer.getByPlaceholderText("Search building");
        await act(async () => {
          fireEvent(endInputBrowse, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE101"));
        });

        await waitFor(() => {
          expect(mapViewer.getByText("VE – Room VE101")).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("start-action-button"));
        });

        const mapView = mapViewer.getByTestId("map-view");
        await act(async () => {
          fireEvent(mapView, "press", { nativeEvent: { action: "press" } });
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("marker-AB"));
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("directions-action-button"));
        });

        await waitFor(() => {
          expect(enrichSpy).toHaveBeenCalled();
        });

        const selections = enrichSpy.mock.calls.at(-1)?.[1];
        expect(selections?.start).toMatchObject({
          roomName: "VE101",
          parentBuildingCode: "VE",
          isIndoorRoom: true,
        });
      } finally {
        enrichSpy.mockRestore();
        useBuildingSearchSpy.mockRestore();
      }
    });

    it("preserves the new room destination when routing again from browse mode with a saved room start", async () => {
      const React = require("react");
      const useBuildingSearchSpy = jest
        .spyOn(SearchBuildingHook, "useBuildingSearch")
        .mockImplementation(() => {
          const [queries, setQueries] = React.useState({ start: "", end: "" });
          const updateQuery = React.useCallback((type, text) => {
            const nextValue = text || "";
            setQueries((prev) =>
              prev[type] === nextValue
                ? prev
                : {
                    ...prev,
                    [type]: nextValue,
                  },
            );
          }, []);
          const swapQueries = React.useCallback(() => {
            setQueries((prev) => ({
              start: prev.end,
              end: prev.start,
            }));
          }, []);

          return {
            queries,
            updateQuery,
            swapQueries,
            results: {
              start: [],
              end: [
                {
                  buildingCode: "VE101",
                  buildingName: "VE101",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE101",
                  isIndoorRoom: true,
                },
                {
                  buildingCode: "LB101",
                  buildingName: "LB101",
                  address: "1400 René-Lévesque Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "LB",
                  roomName: "LB101",
                  isIndoorRoom: true,
                },
              ],
            },
          };
        });

      const hybridNavigation = require("@/utils/hybridNavigation");
      const baseRoutes = {
        walking: [
          {
            summary: "Fast route",
            overview_polyline: { points: "fast-overview" },
            legs: [
              {
                distance: { text: "100 m", value: 100 },
                duration: { text: "2 mins", value: 120 },
                steps: [
                  {
                    distance: { text: "100 m", value: 100 },
                    duration: { text: "2 mins", value: 120 },
                    html_instructions: "Take the fast path",
                    polyline: { points: "fast-step" },
                    travel_mode: "WALK",
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
      };

      fetchAllDirections.mockResolvedValue(baseRoutes);

      const enrichSpy = jest
        .spyOn(hybridNavigation, "enrichRoutesWithIndoorTransitions")
        .mockImplementation(async (routes, selections) => {
          if (
            selections?.start?.roomName !== "VE101" ||
            selections?.end?.roomName !== "LB101"
          ) {
            return routes;
          }

          const walkingRoute = routes.walking?.[0];
          if (!walkingRoute) {
            return routes;
          }

          return {
            ...routes,
            walking: [
              {
                ...walkingRoute,
                legs: walkingRoute.legs.map((leg, index) =>
                  index === 0
                    ? {
                        ...leg,
                        steps: [
                          ...leg.steps,
                          {
                            distance: { text: "8 indoor checkpoints", value: 8 },
                            duration: { text: "Indoor segment", value: 0 },
                            html_instructions:
                              "Enter LB via LB Entry Exit 1 and continue indoors to room LB101.",
                            maneuver: "",
                            polyline: { points: "indoor-step" },
                            travel_mode: "INDOOR",
                          },
                        ],
                      }
                    : leg,
                ),
              },
            ],
          };
        });

      try {
        const mapViewer = render(<MapViewer />);
        const mapView = mapViewer.getByTestId("map-view");

        const browseInput = mapViewer.getByPlaceholderText("Search building");
        await act(async () => {
          fireEvent(browseInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE101"));
        });

        await waitFor(() => {
          expect(mapViewer.getByText("VE – Room VE101")).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("start-action-button"));
        });

        await act(async () => {
          fireEvent(mapView, "press", { nativeEvent: { action: "press" } });
        });

        const newDestinationInput = mapViewer.getByPlaceholderText("Search building");
        await act(async () => {
          fireEvent(newDestinationInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-LB101"));
        });

        await waitFor(() => {
          expect(mapViewer.getByText("LB – Room LB101")).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("directions-action-button"));
        });

        await waitFor(() => {
          expect(enrichSpy).toHaveBeenCalled();
        });

        const selections = enrichSpy.mock.calls.at(-1)?.[1];
        expect(selections?.start).toMatchObject({
          roomName: "VE101",
          parentBuildingCode: "VE",
          isIndoorRoom: true,
        });
        expect(selections?.end).toMatchObject({
          roomName: "LB101",
          parentBuildingCode: "LB",
          isIndoorRoom: true,
        });

        await waitFor(() => {
          expect(mapViewer.getByTestId("routes-info-popup")).toBeTruthy();
        });

        const routesPopup = mapViewer.getByTestId("routes-info-popup");
        await act(async () => {
          routesPopup.props.onResponderGrant({}, {});
          routesPopup.props.onResponderMove({}, { dy: -300 });
          routesPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("walking-route-0"));
        });

        await waitFor(() => {
          expect(
            mapViewer.getByText(
              "Enter LB via LB Entry Exit 1 and continue indoors to room LB101.",
            ),
          ).toBeTruthy();
        });
      } finally {
        enrichSpy.mockRestore();
        useBuildingSearchSpy.mockRestore();
      }
    });

    it("refreshes selected route details after swapping directions so new indoor steps appear", async () => {
      const React = require("react");
      const useBuildingSearchSpy = jest
        .spyOn(SearchBuildingHook, "useBuildingSearch")
        .mockImplementation(() => {
          const [queries, setQueries] = React.useState({ start: "", end: "" });
          const updateQuery = React.useCallback((type, text) => {
            const nextValue = text || "";
            setQueries((prev) =>
              prev[type] === nextValue
                ? prev
                : {
                    ...prev,
                    [type]: nextValue,
                  },
            );
          }, []);
          const swapQueries = React.useCallback(() => {
            setQueries((prev) => ({
              start: prev.end,
              end: prev.start,
            }));
          }, []);

          return {
            queries,
            updateQuery,
            swapQueries,
            results: {
              start: [],
              end: [
                {
                  buildingCode: "VE101",
                  buildingName: "VE101",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE101",
                  isIndoorRoom: true,
                },
              ],
            },
          };
        });

      const hybridNavigation = require("@/utils/hybridNavigation");
      const baseRoutes = {
        walking: [
          {
            summary: "Fast route",
            overview_polyline: { points: "fast-overview" },
            legs: [
              {
                distance: { text: "100 m", value: 100 },
                duration: { text: "2 mins", value: 120 },
                steps: [
                  {
                    distance: { text: "100 m", value: 100 },
                    duration: { text: "2 mins", value: 120 },
                    html_instructions: "Take the fast path",
                    polyline: { points: "fast-step" },
                    travel_mode: "WALK",
                  },
                ],
              },
            ],
          },
          {
            summary: "Scenic route",
            overview_polyline: { points: "scenic-overview" },
            legs: [
              {
                distance: { text: "140 m", value: 140 },
                duration: { text: "3 mins", value: 180 },
                steps: [
                  {
                    distance: { text: "140 m", value: 140 },
                    duration: { text: "3 mins", value: 180 },
                    html_instructions: "Walk along the courtyard",
                    polyline: { points: "scenic-step" },
                    travel_mode: "WALK",
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
      };

      fetchAllDirections.mockResolvedValue(baseRoutes);

      const enrichSpy = jest
        .spyOn(hybridNavigation, "enrichRoutesWithIndoorTransitions")
        .mockImplementation(async (routes) => {
          const walkingRoutes = routes.walking ?? [];
          const scenicRoute = walkingRoutes[1];

          if (enrichSpy.mock.calls.length === 1 || !scenicRoute) {
            return routes;
          }

          return {
            ...routes,
            walking: [
              walkingRoutes[0],
              {
                ...scenicRoute,
                legs: scenicRoute.legs.map((leg, index) =>
                  index === 0
                    ? {
                        ...leg,
                        steps: [
                          ...leg.steps,
                          {
                            distance: { text: "8 indoor checkpoints", value: 8 },
                            duration: { text: "Indoor segment", value: 0 },
                            html_instructions:
                              "Enter VE via Room Entrance and continue indoors to room VE101.",
                            maneuver: "",
                            polyline: { points: "indoor-step" },
                            travel_mode: "INDOOR",
                          },
                        ],
                      }
                    : leg,
                ),
              },
            ],
          };
        });

      try {
        const mapViewer = render(<MapViewer />);
        const mapView = mapViewer.getByTestId("map-view");

        fireEvent(mapView, "onUserLocationChange", {
          nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
        });

        const searchInput = mapViewer.getByPlaceholderText("Search building");
        await act(async () => {
          fireEvent(searchInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE101"));
        });

        await waitFor(() => {
          expect(mapViewer.getByText("VE – Room VE101")).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("directions-action-button"));
        });

        await waitFor(() => {
          expect(mapViewer.getByTestId("routes-info-popup")).toBeTruthy();
        });

        const firstPopup = mapViewer.getByTestId("routes-info-popup");
        await act(async () => {
          firstPopup.props.onResponderGrant({}, {});
          firstPopup.props.onResponderMove({}, { dy: -300 });
          firstPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("walking-route-1"));
        });

        expect(
          mapViewer.queryByText(
            "Enter VE via Room Entrance and continue indoors to room VE101.",
          ),
        ).toBeNull();

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("swap-fields"));
        });

        await waitFor(() => {
          expect(mapViewer.queryByText("Back to routes")).toBeNull();
        });

        await waitFor(() => {
          expect(mapViewer.getByTestId("routes-info-popup")).toBeTruthy();
        });

        const secondPopup = mapViewer.getByTestId("routes-info-popup");
        await act(async () => {
          secondPopup.props.onResponderGrant({}, {});
          secondPopup.props.onResponderMove({}, { dy: -300 });
          secondPopup.props.onResponderRelease({}, { dy: -300, vy: -1 });
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("walking-route-1"));
        });

        await waitFor(() => {
          expect(
            mapViewer.getByText(
              "Enter VE via Room Entrance and continue indoors to room VE101.",
            ),
          ).toBeTruthy();
        });
      } finally {
        enrichSpy.mockRestore();
        useBuildingSearchSpy.mockRestore();
      }
    });

    it("reuses the swapped room as the saved start when routing again from browse mode", async () => {
      const React = require("react");
      const useBuildingSearchSpy = jest
        .spyOn(SearchBuildingHook, "useBuildingSearch")
        .mockImplementation(() => {
          const [queries, setQueries] = React.useState({ start: "", end: "" });
          const updateQuery = React.useCallback((type, text) => {
            const nextValue = text || "";
            setQueries((prev) =>
              prev[type] === nextValue
                ? prev
                : {
                    ...prev,
                    [type]: nextValue,
                  },
            );
          }, []);
          const swapQueries = React.useCallback(() => {
            setQueries((prev) => ({
              start: prev.end,
              end: prev.start,
            }));
          }, []);

          return {
            queries,
            updateQuery,
            swapQueries,
            results: {
              start: [],
              end: [
                {
                  buildingCode: "VE101",
                  buildingName: "VE101",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE101",
                  isIndoorRoom: true,
                },
                {
                  buildingCode: "LB101",
                  buildingName: "LB101",
                  address: "1400 René-Lévesque Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "LB",
                  roomName: "LB101",
                  isIndoorRoom: true,
                },
                {
                  buildingCode: "VE201",
                  buildingName: "VE201",
                  address: "1400 De Maisonneuve Blvd. W.",
                  campus: "SGW",
                  parentBuildingCode: "VE",
                  roomName: "VE201",
                  isIndoorRoom: true,
                },
              ],
            },
          };
        });

      const hybridNavigation = require("@/utils/hybridNavigation");
      const enrichSpy = jest
        .spyOn(hybridNavigation, "enrichRoutesWithIndoorTransitions")
        .mockImplementation(async (routes) => routes);

      fetchAllDirections.mockResolvedValue({
        walking: [
          {
            summary: "",
            overview_polyline: { points: "poly" },
            legs: [
              {
                distance: { text: "100 m", value: 100 },
                duration: { text: "2 mins", value: 120 },
                steps: [
                  {
                    distance: { text: "100 m", value: 100 },
                    duration: { text: "2 mins", value: 120 },
                    html_instructions: "Head north",
                    polyline: { points: "abcd" },
                    travel_mode: "WALK",
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

      try {
        const mapViewer = render(<MapViewer />);
        const mapView = mapViewer.getByTestId("map-view");

        const browseInput = mapViewer.getByPlaceholderText("Search building");
        await act(async () => {
          fireEvent(browseInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE101"));
        });

        await waitFor(() => {
          expect(mapViewer.getByText("VE – Room VE101")).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("start-action-button"));
        });

        const destinationInput = mapViewer.getByPlaceholderText("Destination");
        await act(async () => {
          fireEvent(destinationInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-LB101"));
        });

        await waitFor(() => {
          expect(enrichSpy).toHaveBeenCalled();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("swap-fields"));
        });

        await act(async () => {
          fireEvent(mapView, "press", { nativeEvent: { action: "press" } });
        });

        const nextBrowseInput = mapViewer.getByPlaceholderText("Search building");
        await act(async () => {
          fireEvent(nextBrowseInput, "onFocus");
        });
        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("end-result-VE201"));
        });

        await waitFor(() => {
          expect(mapViewer.getByText("VE – Room VE201")).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(mapViewer.getByTestId("directions-action-button"));
        });

        await waitFor(() => {
          expect(enrichSpy.mock.calls.length).toBeGreaterThan(1);
        });

        const selections = enrichSpy.mock.calls.at(-1)?.[1];
        expect(selections?.start).toMatchObject({
          roomName: "LB101",
          parentBuildingCode: "LB",
          isIndoorRoom: true,
        });
        expect(selections?.end).toMatchObject({
          roomName: "VE201",
          parentBuildingCode: "VE",
          isIndoorRoom: true,
        });
      } finally {
        enrichSpy.mockRestore();
        useBuildingSearchSpy.mockRestore();
      }
    });
  });
});
