import React from "react";
import { act, render, fireEvent } from '@testing-library/react-native';
import RoutesInfoPopup from "@/components/navigation/routes-info-popup";
import mockRoutes from "@/data/mock-data/route-data.json";


const mockAnimateToRegion = jest.fn();

jest.mock('react-native-map-clustering', () => {
  const React = require("react");
  const { forwardRef, useImperativeHandle } = React;
  const { View } = require("react-native");
  const mockCluster = forwardRef((props: React.PropsWithChildren<any>, ref: any) => {
    useImperativeHandle(ref, () => ({
      animateToRegion: mockAnimateToRegion,
    }));
    return <View {...props}>{props.children}</View>;
  });
  mockCluster.displayName = "mockCluster";
  return {
    __esModule: true,
    default: mockCluster

  };
});

jest.mock('expo-location', () => ({
  hasServicesEnabledAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('react-native-maps', () => {
  const { View } = require("react-native");
  return {
    Marker: (props: any) => <View {...props} />,
    Polygon: (props: any) => <View testID="polygon" {...props} />,
  };
});

jest.mock("@/constants/mapData", () => {

  const { getBuildingPolygons } = require("@/utils/getBuildingPolygons");

  return {
    CAMPUS_LOCATIONS: [
      {
        code: "LB",
        location: { latitude: 45.495, longitude: -73.579 },
        polygons: getBuildingPolygons("LB"),
      },
      {
        code: "VE",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("VE"),
      },
      {
        code: "RA",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("RA"),
      },
      {
        code: "PC",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("PC"),
      },
      {
        code: "AB",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: getBuildingPolygons("AB"),
      },
    ],
  };
});

jest.mock('@/data/parsedBuildings', () => ({
  concordiaBuildings: [
    {
      buildingCode: "LB",
      location: { latitude: 45.495, longitude: -73.579 },
    },
    {
      buildingCode: "VE",
      location: { latitude: 45.496, longitude: -73.580 },
    }, {
      buildingCode: "RA",
      location: { latitude: 45.496, longitude: -73.580 },
    },
    {
      buildingCode: "PC",
      location: { latitude: 45.496, longitude: -73.580 },
    },
  ],
}));

jest.mock("@/data/building-addresses.json", () => [
  {
    "buildingCode": "B",
    "buildingName": "B Annex",
    "address": "2160 Bishop St, Montreal, QC",
    "campus": "SGW"
  },
  {
    "buildingCode": "CI",
    "buildingName": "CI Annex",
    "address": "2149 Mackay St., Montreal, QC",
    "campus": "SGW"
  },
  {
    "buildingCode": "CL",
    "buildingName": "CL Annex",
    "address": "1665 Ste-Catherine St. W., Montreal, QC",
    "campus": "SGW"
  },
  {
    "buildingCode": "H",
    "buildingName": "Henry F. Hall Building",
    "address": "1455 Blvd. De Maisonneuve Ouest, Montreal, QC H3G 1M8",
    "campus": "SGW"
  }
]);

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');

  rn.PanResponder.create = (config: { onPanResponderGrant: any; onPanResponderMove: any; onPanResponderRelease: any; }) => ({
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

beforeEach(() => {
  mockAnimateToRegion.mockClear();
});

const mockOnSelect = jest.fn();

describe("RoutesInfoPopup component", () => {
  it('should display the walking routes by default', async () => {
    const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect} />)
    const selector = routesView.getByTestId('navigation-mode-selector');
    expect(selector).toBeVisible();
    const selectorTitle = routesView.getByText("Walking");
    expect(selectorTitle).toBeVisible();
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const route0 = routesView.getByTestId("walking-route-0");
    expect(route0).toBeVisible();
  });

  it('should switch to transit routes when transit is selected', async () => {
    const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect} />)
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const selector = routesView.getByTestId('transit-selector');
    fireEvent.press(selector);
    const selectorTitle = routesView.getByText("Transit");
    expect(selectorTitle).toBeVisible();
    const route0 = routesView.getByTestId("transit-route-0");
    expect(route0).toBeVisible();
  });

  it('should display no routes found message if there are no routes for a transportation mode', async () => {
    const routesView = render(<RoutesInfoPopup routes={{ ...mockRoutes, transit: null }} isOpen={true} onRouteSelect={mockOnSelect} />)
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const selector = routesView.getByTestId('driving-selector');
    fireEvent.press(selector);
    const noRoutesText = routesView.getByTestId("no-routes-text");
    expect(noRoutesText).toBeVisible();
    expect(noRoutesText.props.children).toBe("No route found for this mode of transportation.");
  });

  it('should call onRouteSelect with the correct route when a route is selected', async () => {
    const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect} />)
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const route0 = routesView.getByTestId("walking-route-0");
    fireEvent.press(route0);
    expect(mockOnSelect).toHaveBeenCalledWith(mockRoutes.walking[0]);
  });

  it('should not render if there are no available transportation modes', async () => {
    const routesView = render(<RoutesInfoPopup routes={{ walking: null, transit: null, driving: null, bicycling: null, shuttle: null }} isOpen={true} onRouteSelect={mockOnSelect} />)
    const popup = routesView.queryByTestId('routes-info-popup');
    expect(popup).toBeNull();
  });

  it('should enter step detail view when a route is pressed', async () => {
    const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect} />);
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const route0 = routesView.getByTestId("walking-route-0");
    await act(async () => {
      fireEvent.press(route0);
    });
    // Step detail: back button should appear and route list should be gone
    const backButton = routesView.getByTestId("back-to-routes-button");
    expect(backButton).toBeVisible();
    expect(routesView.queryByTestId("walking-route-0")).toBeNull();
  });

  it('should return to route list when back button is pressed', async () => {
    const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect} />);
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const route0 = routesView.getByTestId("walking-route-0");
    await act(async () => {
      fireEvent.press(route0);
    });
    const backButton = routesView.getByTestId("back-to-routes-button");
    await act(async () => {
      fireEvent.press(backButton);
    });
    // Back to route list: route-0 should be visible again
    expect(routesView.getByTestId("walking-route-0")).toBeVisible();
    expect(routesView.queryByTestId("back-to-routes-button")).toBeNull();
  });

  it('should call onStepSelect with encoded polyline and travel mode when a step is pressed', async () => {
    const mockOnStepSelect = jest.fn();
    const routesView = render(
      <RoutesInfoPopup
        routes={mockRoutes}
        isOpen={true}
        onRouteSelect={mockOnSelect}
        onStepSelect={mockOnStepSelect}
      />
    );
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const route0 = routesView.getByTestId("walking-route-0");
    await act(async () => {
      fireEvent.press(route0);
    });
    const step0 = routesView.getByTestId("walking-step-0");
    await act(async () => {
      fireEvent.press(step0);
    });
    expect(mockOnStepSelect).toHaveBeenCalledWith(
      expect.any(String), // encoded polyline
      expect.any(String), // travel mode
      undefined           // no vehicle type for walking steps
    );
  });

  it('should reset step detail view when switching transport tabs', async () => {
    const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect} />);
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    // Enter step detail for walking
    const route0 = routesView.getByTestId("walking-route-0");
    await act(async () => {
      fireEvent.press(route0);
    });
    expect(routesView.getByTestId("back-to-routes-button")).toBeVisible();
    // Switch to transit tab
    const transitSelector = routesView.getByTestId("transit-selector");
    await act(async () => {
      fireEvent.press(transitSelector);
    });
    // Step detail should be cleared; transit routes should be visible
    expect(routesView.queryByTestId("back-to-routes-button")).toBeNull();
    expect(routesView.getByTestId("transit-route-0")).toBeVisible();
  });

  it('should display route summary and step count in step detail view', async () => {
    const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect} />);
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const route0 = routesView.getByTestId("walking-route-0");
    await act(async () => {
      fireEvent.press(route0);
    });
    // Step detail header shows duration and distance from the first leg
    const leg = mockRoutes.walking[0].legs[0];
    const summaryText = `${leg.duration.text} · ${leg.distance.text}`;
    expect(routesView.getByText(summaryText)).toBeVisible();
  });

  it('should display via summary and departure/arrival time when route has those fields', async () => {
    const routeWithMeta = {
      ...mockRoutes.walking[0],
      summary: "Via Rue Sainte-Catherine O",
      legs: [{
        ...mockRoutes.walking[0].legs[0],
        departure_time: { text: "10:00 AM" },
        arrival_time: { text: "10:37 AM" },
      }],
    };
    const routes = { ...mockRoutes, walking: [routeWithMeta] };
    const routesView = render(<RoutesInfoPopup routes={routes} isOpen={true} onRouteSelect={mockOnSelect} />);
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    expect(routesView.getByText(/Via Rue Sainte-Catherine O/)).toBeVisible();
    expect(routesView.getByText(/From 10:00 AM/)).toBeVisible();
  });

  it('should render transit_details line info inside a route step', async () => {
    const transitRoute = {
      summary: "",
      overview_polyline: { points: "" },
      legs: [{
        distance: { text: "2 km", value: 2000 },
        duration: { text: "8 mins", value: 480 },
        departure_time: undefined,
        arrival_time: undefined,
        steps: [{
          distance: { text: "5 stops", value: 2000 },
          duration: { text: "8 mins", value: 480 },
          html_instructions: "Take the Green Line",
          maneuver: "",
          polyline: { points: "transit_poly" },
          travel_mode: "TRANSIT",
          transit_details: {
            line: { name: "Green Line", short_name: "GRN", vehicle_type: "SUBWAY" },
            departure_stop: { name: "Guy-Concordia", location: null },
            arrival_stop: { name: "McGill", location: null },
          },
        }],
      }],
    };
    const routes = { ...mockRoutes, transit: [transitRoute] };
    const routesView = render(<RoutesInfoPopup routes={routes} isOpen={true} onRouteSelect={mockOnSelect} />);
    const popup = routesView.getByTestId('routes-info-popup');
    await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const transitSelector = routesView.getByTestId('transit-selector');
    fireEvent.press(transitSelector);
    const route0 = routesView.getByTestId("transit-route-0");
    await act(async () => { fireEvent.press(route0); });
    const step = routesView.getByTestId("transit-step-0");
    expect(step).toBeVisible();
    expect(routesView.getByText(/GRN/)).toBeVisible();
    expect(routesView.getByText(/Guy-Concordia/)).toBeVisible();
  });

  it('should show the shuttle selector when shuttle routes are available', async () => {
    const routesWithShuttle = { ...mockRoutes, shuttle: [] as any[] };
    const routesView = render(<RoutesInfoPopup routes={routesWithShuttle} isOpen={true} onRouteSelect={mockOnSelect} />);
    // shuttle key is not null -> shuttle-selector should appear
    expect(routesView.queryByTestId('shuttle-selector')).toBeTruthy();
  });

});