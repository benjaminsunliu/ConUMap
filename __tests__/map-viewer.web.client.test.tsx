import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import type { SearchBuilding } from "@/types/buildingTypes";

const mockPush = jest.fn();
const mockSetParams = jest.fn();
const mockFetchAllDirections = jest.fn();
const mockEnrichRoutesWithIndoorTransitions = jest.fn(async (routes) => routes);
const mockUsePoi = jest.fn(() => []);
const mockDivIcon = jest.fn((options: any) => ({ options }));

let latestBuildingSelectionProps: any;
let latestBuildingInfoPopupProps: any;
let latestRoutesInfoPopupProps: any;
let latestOutdoorMapSettingsProps: any;
let latestPoiInfoPopupProps: any;

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("leaflet/dist/leaflet.css", () => ({}), { virtual: true });

jest.mock("leaflet", () => ({
  Map: function MockLeafletMap() { },
  divIcon: (...args: unknown[]) => mockDivIcon(...args),
}));

jest.mock("react-leaflet", () => {
  const React = require("react");
  const { View } = require("react-native");

  const mapApi = {
    flyTo: jest.fn(),
    getZoom: jest.fn(() => 15),
    getCenter: jest.fn(() => ({ lat: 45.495, lng: -73.579 })),
    getBounds: jest.fn(() => ({
      getNorthEast: () => ({ lat: 45.496, lng: -73.578 }),
      getSouthWest: () => ({ lat: 45.494, lng: -73.58 }),
    })),
  };

  return {
    MapContainer: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    TileLayer: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    Polygon: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    Polyline: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    CircleMarker: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    Marker: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    Tooltip: ({ children }: any) => <>{children}</>,
    useMap: () => mapApi,
    useMapEvents: () => mapApi,
  };
});

jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    const React = require("react");
    React.useEffect(effect, [effect]);
  },
  useLocalSearchParams: jest.fn(() => ({})),
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    setParams: (...args: unknown[]) => mockSetParams(...args),
  },
}));

jest.mock("expo-location", () => ({
  hasServicesEnabledAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock("@/utils/directions", () => ({
  fetchAllDirections: (...args: unknown[]) => mockFetchAllDirections(...args),
}));

jest.mock("@/utils/hybridNavigation", () => {
  const actual = jest.requireActual("@/utils/hybridNavigation");
  return {
    ...actual,
    enrichRoutesWithIndoorTransitions: (...args: unknown[]) =>
      mockEnrichRoutesWithIndoorTransitions(...args),
  };
});

jest.mock("@/constants/map", () => ({
  CAMPUS_BUILDINGS: [
    {
      buildingCode: "MB",
      buildingName: "John Molson Building",
      address: "1450 Guy St",
      campus: "SGW",
      location: { latitude: 45.495, longitude: -73.579 },
      polygons: [],
    },
    {
      buildingCode: "H",
      buildingName: "Henry F. Hall Building",
      address: "1455 De Maisonneuve Blvd W",
      campus: "SGW",
      location: { latitude: 45.497, longitude: -73.5795 },
      polygons: [],
    },
  ],
}));

jest.mock("@/hooks/use-poi", () => ({
  usePoi: (...args: unknown[]) => mockUsePoi(...args),
}));

jest.mock("@/globals/IndoorMapSettingsStore", () => ({
  IndoorMapSettings: {
    getSettings: jest.fn().mockResolvedValue({ wheelchairOnly: false }),
    getCachedSettings: jest.fn(() => ({ wheelchairOnly: false })),
  },
}));

jest.mock("@/globals/IndoorNavigationLoader", () => ({
  NavigationLoader: {
    buildingHasNavigationData: jest.fn((buildingCode: string) =>
      ["MB", "H"].includes(buildingCode),
    ),
  },
}));

jest.mock("@/components/map/building-selection", () => ({
  __esModule: true,
  CURRENT_LOCATION_CODE: "CURRENT_LOCATION",
  default: (props: any) => {
    latestBuildingSelectionProps = props;
    return null;
  },
}));

jest.mock("@/components/map/building-info-popup", () => ({
  __esModule: true,
  default: (props: any) => {
    latestBuildingInfoPopupProps = props;
    return null;
  },
}));

jest.mock("@/components/navigation/routes-info-popup", () => ({
  __esModule: true,
  default: (props: any) => {
    latestRoutesInfoPopupProps = props;
    return null;
  },
}));

jest.mock("@/components/map/campus-toggle", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/map/location-button", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/map/location-modal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/map/outdoor-map-settings", () => ({
  __esModule: true,
  default: (props: any) => {
    latestOutdoorMapSettingsProps = props;
    return null;
  },
}));

jest.mock("@/components/map/poi-info-popup", () => ({
  __esModule: true,
  POIInfoPopup: (props: any) => {
    latestPoiInfoPopupProps = props;
    return null;
  },
}));

const MapViewerWebClient = require("@/components/map/map-viewer.web.client").default;

function makeRoomSelection(buildingCode: string, roomName: string): SearchBuilding {
  return {
    buildingCode: roomName,
    buildingName: roomName,
    address: `${buildingCode} address`,
    campus: "SGW",
    parentBuildingCode: buildingCode,
    roomName,
    isIndoorRoom: true,
  };
}

describe("map-viewer.web.client", () => {
  const mbRoomOne = makeRoomSelection("MB", "MB 1.115");
  const mbRoomTwo = makeRoomSelection("MB", "MB 1.130");
  const hRoom = makeRoomSelection("H", "H 8.001");
  const hBuilding: SearchBuilding = {
    buildingCode: "H",
    buildingName: "Henry F. Hall Building",
    address: "1455 De Maisonneuve Blvd W",
    campus: "SGW",
  };

  beforeEach(() => {
    mockPush.mockClear();
    mockSetParams.mockClear();
    mockFetchAllDirections.mockReset();
    mockFetchAllDirections.mockResolvedValue({
      walking: [],
      transit: [],
      driving: [],
      bicycling: [],
      shuttle: [],
    });
    mockEnrichRoutesWithIndoorTransitions.mockClear();
    mockUsePoi.mockReset();
    mockUsePoi.mockReturnValue([]);
    mockDivIcon.mockClear();
    latestBuildingSelectionProps = undefined;
    latestBuildingInfoPopupProps = undefined;
    latestRoutesInfoPopupProps = undefined;
    latestOutdoorMapSettingsProps = undefined;
    latestPoiInfoPopupProps = undefined;
    global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    }) as typeof requestAnimationFrame;
  });

  it("renders the outdoor POI settings on web in browse mode", () => {
    mockUsePoi.mockReturnValue([
      {
        place_id: "poi-1",
        name: "Campus Cafe",
        types: ["cafe"],
        geometry: {
          location: { lat: 45.4955, lng: -73.5791 },
          viewport: {
            northeast: { lat: 45.4956, lng: -73.579 },
            southwest: { lat: 45.4954, lng: -73.5792 },
          },
        },
      },
    ]);

    render(<MapViewerWebClient />);

    expect(latestOutdoorMapSettingsProps).toMatchObject({
      radius: 0,
      hasVisiblePopup: false,
      searchFieldFocused: false,
    });
    expect(latestPoiInfoPopupProps).toBeUndefined();
  });

  it("clusters buildings to a campus marker on web at low zoom", () => {
    render(<MapViewerWebClient />);

    expect(mockDivIcon).toHaveBeenCalled();
    expect(mockDivIcon.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        className: "",
        iconSize: [46, 26],
        iconAnchor: [23, 13],
      }),
    );
    expect(mockDivIcon).toHaveBeenCalledTimes(2);
    const campusHtml = mockDivIcon.mock.calls.map((call) => call[0].html).join(" ");
    expect(campusHtml).toContain("SGW");
    expect(campusHtml).toContain("LOY");
    expect(campusHtml).toContain("font-size:12px");
    expect(campusHtml).toContain("border:1.5px solid");
    expect(campusHtml).toContain("border-radius:999px");
    expect(campusHtml).toContain("#5e0e16");
    expect(campusHtml).not.toContain("rotate(45deg)");
  });

  it("renders building markers as smaller maroon rounded badges when zoomed in", () => {
    render(
      <MapViewerWebClient
        initialRegion={{
          latitude: 45.495,
          longitude: -73.579,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }}
      />,
    );

    expect(mockDivIcon).toHaveBeenCalled();
    expect(mockDivIcon.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        className: "",
        iconSize: [34, 28],
        iconAnchor: [17, 28],
      }),
    );
    expect(mockDivIcon.mock.calls[0][0].html).toContain("border-radius:999px");
    expect(mockDivIcon.mock.calls[0][0].html).toContain("#5e0e16");
  });

  it("opens indoor room-to-room navigation on web when both selections are rooms in the same building", async () => {
    render(<MapViewerWebClient />);

    act(() => {
      latestBuildingSelectionProps.onSelect({ start: null, end: mbRoomOne }, "end");
    });

    await waitFor(() => {
      expect(latestBuildingInfoPopupProps.building.buildingCode).toBe("MB");
    });

    act(() => {
      latestBuildingInfoPopupProps.onSetAsStart();
    });

    await waitFor(() => {
      expect(latestBuildingSelectionProps.mode).toBe("directions");
    });

    act(() => {
      latestBuildingSelectionProps.onSelect({ start: mbRoomOne, end: mbRoomTwo }, "end");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/[buildingCode]",
        params: {
          buildingCode: "MB",
          indoorStartRoom: "MB 1.115",
          indoorEndRoom: "MB 1.130",
        },
      });
    });
  });

  it("swaps room selections used for route enrichment on web", async () => {
    render(<MapViewerWebClient />);

    act(() => {
      latestBuildingSelectionProps.onSelect({ start: null, end: mbRoomOne }, "end");
    });

    await waitFor(() => {
      expect(latestBuildingInfoPopupProps.building.buildingCode).toBe("MB");
    });

    act(() => {
      latestBuildingInfoPopupProps.onSetAsStart();
    });

    await waitFor(() => {
      expect(latestBuildingSelectionProps.mode).toBe("directions");
    });

    act(() => {
      latestBuildingSelectionProps.onSelect({ start: mbRoomOne, end: hRoom }, "end");
    });

    await waitFor(() => {
      expect(mockEnrichRoutesWithIndoorTransitions).toHaveBeenLastCalledWith(
        expect.anything(),
        {
          start: mbRoomOne,
          end: hRoom,
        },
        expect.anything(),
        expect.anything(),
      );
    });

    act(() => {
      latestBuildingSelectionProps.onSwap();
    });

    await waitFor(() => {
      expect(mockEnrichRoutesWithIndoorTransitions).toHaveBeenLastCalledWith(
        expect.anything(),
        {
          start: hRoom,
          end: mbRoomOne,
        },
        expect.anything(),
        expect.anything(),
      );
    });
  });

  it("reuses a saved room start when routing to another building on web", async () => {
    render(<MapViewerWebClient />);

    act(() => {
      latestBuildingSelectionProps.onSelect({ start: null, end: mbRoomOne }, "end");
    });

    await waitFor(() => {
      expect(latestBuildingInfoPopupProps.building.buildingCode).toBe("MB");
    });

    act(() => {
      latestBuildingInfoPopupProps.onSetAsStart();
    });

    await waitFor(() => {
      expect(latestBuildingSelectionProps.mode).toBe("directions");
    });

    act(() => {
      latestRoutesInfoPopupProps.onBack();
    });

    await waitFor(() => {
      expect(latestBuildingSelectionProps.mode).toBe("browse");
    });

    act(() => {
      latestBuildingSelectionProps.onSelect({ start: null, end: hBuilding }, "end");
    });

    await waitFor(() => {
      expect(latestBuildingInfoPopupProps.building.buildingCode).toBe("H");
    });

    act(() => {
      latestBuildingInfoPopupProps.onNavigate();
    });

    await waitFor(() => {
      expect(mockEnrichRoutesWithIndoorTransitions).toHaveBeenLastCalledWith(
        expect.anything(),
        {
          start: mbRoomOne,
          end: null,
        },
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
