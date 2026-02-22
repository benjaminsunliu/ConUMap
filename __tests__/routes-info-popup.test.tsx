import React from "react";
import {act, render, fireEvent} from '@testing-library/react-native';
import RoutesInfoPopup from "@/components/navigation/routes-info-popup";
import mockRoutes from "@/data/mock-data/route-data.json";


const mockAnimateToRegion = jest.fn();

jest.mock('react-native-map-clustering', () => {
  const React = require("react");
  const {forwardRef, useImperativeHandle} = React;
  const { View } = require("react-native");
  const  mockCluster =  forwardRef((props: React.PropsWithChildren<any>, ref: any) => {
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
    },  {
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
  it('should display the walking routes by default', async ()=>{
      const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect}/>)
      const selector = routesView.getByTestId('navigation-mode-selector');
      expect(selector).toBeVisible();
      const selectorTitle = routesView.getByText("Walking");
      expect(selectorTitle).toBeVisible();
      const popup = routesView.getByTestId('info-popup');
        await act(async () => {
        popup.props.onResponderGrant({}, {});
        popup.props.onResponderMove({}, { dy: -300 });
        popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
      });
      const route0 = routesView.getByTestId("walking-route-0");
      expect(route0).toBeVisible();
  });

  it('should switch to transit routes when transit is selected', async ()=>{
    const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect}/>)
    const popup = routesView.getByTestId('info-popup');
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

  it('should display no routes found message if there are no routes for a transportation mode', async ()=>{
    const routesView = render(<RoutesInfoPopup routes={{...mockRoutes, transit: null}} isOpen={true} onRouteSelect={mockOnSelect}/>)
    const popup = routesView.getByTestId('info-popup');
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

  it('should call onRouteSelect with the correct route when a route is selected', async ()=>{
    const routesView = render(<RoutesInfoPopup routes={mockRoutes} isOpen={true} onRouteSelect={mockOnSelect}/>)
    const popup = routesView.getByTestId('info-popup');
      await act(async () => {
      popup.props.onResponderGrant({}, {});
      popup.props.onResponderMove({}, { dy: -300 });
      popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
    });
    const route0 = routesView.getByTestId("walking-route-0");
    fireEvent.press(route0);
    expect(mockOnSelect).toHaveBeenCalledWith(mockRoutes.walking[0]);
  });

  it('should not render if there are no available transportation modes', async ()=>{
    const routesView = render(<RoutesInfoPopup routes={{walking: null, transit: null, driving: null, bicycling: null, shuttle: null}} isOpen={true} onRouteSelect={mockOnSelect}/>)
    const popup = routesView.queryByTestId('info-popup');
    expect(popup).toBeNull();
  });

});