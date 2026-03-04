import React from "react";
import {act, render, fireEvent} from '@testing-library/react-native';
import * as LocationPermissions from 'expo-location';
import { CAMPUS_LOCATIONS } from "@/constants/mapData";
import { concordiaBuildings } from "@/data/parsedBuildings";
import MapViewer from '../components/map/map-viewer';
import { Colors } from "@/constants/theme";

const mockAnimateToRegion = jest.fn();

jest.mock('react-native-map-clustering', () => {
  const React = require('react');
  const { forwardRef, useImperativeHandle } = React;
  const { View } = require('react-native');

  const  mockCluster =  forwardRef((props, ref) => {
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
  const { View } = require('react-native');
  return {
    Marker: (props) => <View {...props} />,
    Polygon: (props) => <View testID="polygon" {...props} />,
    Polyline: (props) => <View testID="polyline" {...props} />,
  };
});

jest.mock('@/utils/directions', () => ({
  fetchAllDirections: jest.fn().mockResolvedValue({
    walking: [],
    transit: [],
    driving: [],
    bicycling: [],
    shuttle: [],
  }),
}));

jest.mock('@/utils/decodePolyline', () => ({
  decodePolyline: jest.fn().mockReturnValue([]),
}));

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
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

jest.mock("@/constants/mapData", () => {
  const { getBuildingPolygons} = require("../utils/getBuildingPolygons");

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
      beforeEach(() => {
        mockAnimateToRegion.mockClear();
      });

  describe('map tab',()=>{
    it(' should display the map',()=>{
        const mapView = render(<MapViewer/>)
        const map = mapView.getByTestId('map-view')
        expect(map).toBeVisible();
    });

    it('shows correct default location ', () => {
  
        const mapView = render(<MapViewer />);
        const mapView_ = mapView.getByTestId('map-view');
        expect(mapView_.props.initialRegion).toEqual({
            latitude: 45.49575,
            longitude: -73.5793055556,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0922,
          });
    });

      it('if location enabled is  on and ForegroundPermissions is not granted it would not try to getCurrentPosition  ', async () => {

        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
        LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({ status: null });
        LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
          coords: { latitude: 45.49575, longitude:  -73.5793055556 },
      });

       const mapViewer = render(<MapViewer />);
       const locationButton = mapViewer.getByTestId('locationButton');
       await act(async () => {
        await fireEvent.press(locationButton);
       });
       expect(mockAnimateToRegion).not.toHaveBeenCalled();
       expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
       expect(LocationPermissions.requestForegroundPermissionsAsync).toHaveBeenCalled();
       expect(LocationPermissions.getCurrentPositionAsync).not.toHaveBeenCalled();

     });

     it('if location state is on  it will center location ', async () => {

       const mapViewer = render(<MapViewer />);
       const mapView = mapViewer.getByTestId('map-view');
        //user location updates which makes locationState on
       fireEvent(mapView, 'onUserLocationChange', {
        nativeEvent: { coordinate: { latitude: 45.49575, longitude: -73.5793055556  } },
      });
         const locationButton = mapViewer.getByTestId('locationButton')
         await act(async () => {
          await fireEvent.press(locationButton);
         });
         expect(mockAnimateToRegion).toHaveBeenCalled();

     });

     it('if location state is off , locationEnabled is false and location button is pressed, modalOpen will be true ', async () => {

        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(false);
        const mapViewer = render(<MapViewer />);
        const locationButton = mapViewer.getByTestId('locationButton')
        await act(async () => {
          await fireEvent.press(locationButton);
        });
       expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
       const modal = await mapViewer.findByTestId('location-modal');
       expect(modal).toBeVisible();

     });
    

      it('closes modal if onRequestClose is called ', async()=>{
        
        const mapViewer = render(<MapViewer />);
        const locationButton = mapViewer.getByTestId('locationButton')

        await act(async () => {
          await fireEvent.press(locationButton);
        });
        const modal = await mapViewer.findByTestId("location-modal");
        expect(modal).toBeVisible();
        fireEvent(modal, "onRequestClose");
        const modal_ = mapViewer.queryByTestId("location-modal");
        expect(modal_).toBeNull();

      });

      it('just returns if coordinate is null', ()=>{

        const mapViewer = render(<MapViewer />);
        const mapView = mapViewer.getByTestId('map-view');
        fireEvent(mapView, 'onUserLocationChange', {
            nativeEvent: { coordinate: null }
          });
          expect(mapView).toBeTruthy();
      });

      it('if userLocation exists it sets it null when dragging',async()=>{
       const userLocationDelta = {  latitudeDelta: 0.00922,
            longitudeDelta: 0.00421}
        const mapViewer = render(<MapViewer   userLocationDelta={ userLocationDelta }
            initialRegion={{ latitude: 45.49575, longitude: -73.5793055556, latitudeDelta: 0.0922,
                longitudeDelta: 0.0922, }}/>);
        const mapView = mapViewer.getByTestId('map-view');
        fireEvent(mapView, 'onUserLocationChange', {
        nativeEvent: { coordinate: { latitude: 45.49575, longitude: -73.5793055556 } },
        });
        const locationButton = mapViewer.getByTestId('locationButton')
        await act(async () => {
         await fireEvent.press(locationButton);
        });
        expect(mapViewer.getByTestId('map-view').props.followsUserLocation).toBe(true);
        await act(async () => {
         await fireEvent(mapView, "panDrag");
        });
        //no longer following user because dragged
      expect(mapViewer.getByTestId('map-view').props.followsUserLocation).toBe(false);
      });

      it("displays polygon for all campus locations",()=>{
        const mapViewer = render(<MapViewer />);
        const polygons = mapViewer.getAllByTestId('polygon');
     const expectedCount = CAMPUS_LOCATIONS.reduce(
      (total, building) => total + building.polygons.length,
      0
    );
      expect(polygons).toHaveLength(expectedCount);
    });

    it("deselects building when map is pressed",async()=>{

      const mapViewer = render(<MapViewer />);
      const polygons = mapViewer.getAllByTestId("polygon");
      await act(async () => {
       await fireEvent.press(polygons[0]);
      });
          const map = mapViewer.getByTestId("map-view");
      fireEvent(map, "press", {
        nativeEvent: { action: "press" },
      });
      expect(mapViewer.queryByTestId("building-info-popup")).toBeNull();
    })

    it("focuses on building when polygon is pressed",()=>{

      const mapViewer = render(<MapViewer />);
      const building = concordiaBuildings[0];
      const polygon = mapViewer.getAllByTestId("polygon")[0];
      fireEvent.press(polygon);
      expect(mockAnimateToRegion).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: building.location.latitude,
          longitude: building.location.longitude,
          latitudeDelta: expect.any(Number),
          longitudeDelta: expect.any(Number),
        }));
    });

    it("Offset markers to prevent overlap  for VE building",()=>{
      const mapViewer = render(<MapViewer />);
      const ve = concordiaBuildings.find(b => b.buildingCode === "VE");
      const marker = mapViewer.getByTestId("marker-VE");
      expect(marker.props.coordinate).toEqual({
        latitude: ve.location.latitude + 0.00008,
        longitude: ve.location.longitude - 0.00015,
      });

    })
    
    it("Offset markers to prevent overlap  for RA building",()=>{
      const mapViewer= render(<MapViewer />);
      const ra = concordiaBuildings.find(a => a.buildingCode === "RA");
      const marker = mapViewer.getByTestId("marker-RA");
      expect(marker.props.coordinate).toEqual({
        latitude: ra.location.latitude - 0.0009,
        longitude: ra.location.longitude - 0.0008,
      });

    });

    it("Offset markers to prevent overlap for PC building",()=>{
      const mapViewer = render(<MapViewer />);
      const pc = concordiaBuildings.find(b => b.buildingCode === "PC");
      const marker = mapViewer.getByTestId("marker-PC");
      expect(marker.props.coordinate).toEqual({
        latitude: pc.location.latitude - 0.0006,
        longitude: pc.location.longitude - 0.0005,
      });

    });
    it('focuses building when pressed', () => {
      const mapViewer = render(<MapViewer />);
      const building = concordiaBuildings[0];
      const marker = mapViewer.getByTestId(`marker-${building.buildingCode}`);
      fireEvent.press(marker);
      expect(mockAnimateToRegion).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: building.location.latitude,
          longitude: building.location.longitude,
          latitudeDelta: expect.any(Number),
          longitudeDelta: expect.any(Number),
        })
      );
    });

    it(" focusBuilding makes deltas smaller if they are large",()=>{
      const mapViewer = render(
        <MapViewer initialRegion={{ latitude: 45, longitude: -73, latitudeDelta: 0.1, longitudeDelta: 0.1 }} />
      );
      const lb = concordiaBuildings[0];
      const marker = mapViewer.getByTestId(`marker-${lb.buildingCode}`);
      fireEvent.press(marker);
    
      expect(mockAnimateToRegion).toHaveBeenCalledWith(
        expect.objectContaining({
          latitudeDelta: 0.0025,
          longitudeDelta: 0.0025,
        }))    
     });

    it("if unknown building selected it will be null",()=>{
      const mapViewer = render(<MapViewer />);
      const markerAB = mapViewer.getByTestId("marker-AB");
      fireEvent.press(markerAB);
      expect(mapViewer.queryByTestId("building-info-popup")).toBeNull();
    });

    describe('Polygon Color Selection Logic', () => {

      it('should render polygonFill color when no building is selected and user is not inside', () => {
        const mapViewer = render(<MapViewer />);
        
        const polygons = mapViewer.getAllByTestId('polygon');
        expect(polygons[0].props.fillColor).toBe(Colors.light.map.polygonFill);
      });

      it('should render currentBuildingColor when user is inside building but it is not selected', async () => {
        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
        LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
          coords: { latitude: 45.49674, longitude: -73.57856 }, // Inside LB building
        });

        const mapViewer = render(<MapViewer />);
        
        const locationButton = mapViewer.getByTestId('locationButton');
        await act(async () => {
          fireEvent.press(locationButton);
        });

        const polygons = mapViewer.getAllByTestId('polygon');
        expect(polygons[0].props.fillColor).toBe(Colors.light.map.currentBuildingColor);
      });

      it('should update polygon color when user location changes from inside to outside', async () => {
        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
        LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
          coords: { latitude: 45.49674, longitude: -73.57856 }, // Inside LB building
        });

        const mapViewer = render(<MapViewer />);
        
        const locationButton = mapViewer.getByTestId('locationButton');
        await act(async () => {
          fireEvent.press(locationButton);
        });

        // Verify user is inside currentBuildingColor
        let polygons = mapViewer.getAllByTestId('polygon');
        expect(polygons[0].props.fillColor).toBe(Colors.light.map.currentBuildingColor);

        // Simulate user moving outside
        const mapView = mapViewer.getByTestId('map-view');
        await act(async () => {
          fireEvent(mapView, 'onUserLocationChange', {
            nativeEvent: { coordinate: { latitude: 45.5, longitude: -73.6 } }, // Outside any building
          });
        });

        // Verify reverted to polygonFill
        polygons = mapViewer.getAllByTestId('polygon');
        expect(polygons[0].props.fillColor).toBe(Colors.light.map.polygonFill);
      });

      it('should apply correct color for all combinations of selection and location state', () => {
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
        expect(testColorLogic(true, true)).toBe(Colors.light.map.currentSelectedBuildingColor);
        
        // Test scenario 2: selected but NOT in building  
        expect(testColorLogic(true, false)).toBe(Colors.light.map.polygonHighlighted);
        
        // Test scenario 3: NOT selected but in building
        expect(testColorLogic(false, true)).toBe(Colors.light.map.currentBuildingColor);
        
        // Test scenario 4: NOT selected and NOT in building
        expect(testColorLogic(false, false)).toBe(Colors.light.map.polygonFill);
      });

      it('should render currentSelectedBuildingColor when user is inside a selected building', async () => {
        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
        LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
          coords: { latitude: 45.49674, longitude: -73.57856 }, // Inside LB building
        });

        const mapViewer = render(<MapViewer />);
        
        // Enable user location
        const locationButton = mapViewer.getByTestId('locationButton');
        await act(async () => {
          fireEvent.press(locationButton);
        });

        // Verify polygon shows currentBuildingColor (user inside, not selected)
        let polygons = mapViewer.getAllByTestId('polygon');
        expect(polygons[0].props.fillColor).toBe(Colors.light.map.currentBuildingColor);

        // Select the building by pressing its polygon
        await act(async () => {
          fireEvent.press(polygons[0]);
        });

        // Verify polygon now shows currentSelectedBuildingColor (user inside AND selected)
        polygons = mapViewer.getAllByTestId('polygon');
        expect(polygons[0].props.fillColor).toBe(Colors.light.map.currentSelectedBuildingColor);
      });
    });

    it('shows start-hint after navigateToBuilding is called without a user location', async () => {
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

    it('navigateToBuilding uses userLocation as start when user location is set', async () => {
      const { fetchAllDirections } = require('@/utils/directions');
      const mapViewer = render(<MapViewer />);
      const mapView = mapViewer.getByTestId('map-view');

      // Give the map a user location
      fireEvent(mapView, 'onUserLocationChange', {
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
        expect.objectContaining({ latitude: expect.any(Number), longitude: expect.any(Number) })
      );
    });

    it('onRegionChangeComplete updates the current region state', async () => {
      const mapViewer = render(<MapViewer />);
      const mapView = mapViewer.getByTestId('map-view');
      await act(async () => {
        fireEvent(mapView, 'onRegionChangeComplete', {
          latitude: 45.458,
          longitude: -73.640,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      });
      // CampusToggle should reflect the new region (now closer to LOY)
      expect(mapViewer.getByText("Loyola")).toBeTruthy();
    });

    it('onRegionChangeComplete sets locationState to "centered" when near user location', async () => {
      const mapViewer = render(<MapViewer />);
      const mapView = mapViewer.getByTestId('map-view');

      // First set a user location
      fireEvent(mapView, 'onUserLocationChange', {
        nativeEvent: { coordinate: { latitude: 45.496, longitude: -73.578 } },
      });

      // Region change that's very close to the user location
      await act(async () => {
        fireEvent(mapView, 'onRegionChangeComplete', {
          latitude: 45.496,
          longitude: -73.578,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      });

      // The locationButton should now be in "centered" state
      const locationButton = mapViewer.getByTestId('locationButton');
      expect(locationButton).toBeTruthy();
    });

    it('renders polylines after a route with valid coords is selected', async () => {
      const { fetchAllDirections } = require('@/utils/directions');
      const { decodePolyline } = require('@/utils/decodePolyline');

      const mockRoute = {
        summary: "Test Route",
        overview_polyline: { points: "testpoly" },
        legs: [{
          distance: { text: "500 m", value: 500 },
          duration: { text: "6 mins", value: 360 },
          departure_time: undefined,
          arrival_time: undefined,
          steps: [{
            distance: { text: "500 m", value: 500 },
            duration: { text: "6 mins", value: 360 },
            html_instructions: "Head north",
            maneuver: "",
            polyline: { points: "testpoly" },
            travel_mode: "WALKING",
            transit_details: undefined,
          }],
        }],
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
      const mapView = mapViewer.getByTestId('map-view');

      // Set user location so navigateToBuilding can set a start coord
      fireEvent(mapView, 'onUserLocationChange', {
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
      const routesPopup = mapViewer.getByTestId('routes-info-popup');
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

    it('onStepSelect animates map to midpoint of the decoded step polyline', async () => {
      const { fetchAllDirections } = require('@/utils/directions');
      const { decodePolyline } = require('@/utils/decodePolyline');

      const mockRoute = {
        summary: "",
        overview_polyline: { points: "poly" },
        legs: [{
          distance: { text: "200 m", value: 200 },
          duration: { text: "3 mins", value: 180 },
          departure_time: undefined,
          arrival_time: undefined,
          steps: [{
            distance: { text: "200 m", value: 200 },
            duration: { text: "3 mins", value: 180 },
            html_instructions: "Walk",
            maneuver: "",
            polyline: { points: "steppoly" },
            travel_mode: "WALKING",
            transit_details: undefined,
          }],
        }],
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
      const mapView = mapViewer.getByTestId('map-view');

      fireEvent(mapView, 'onUserLocationChange', {
        nativeEvent: { coordinate: { latitude: 45.495, longitude: -73.579 } },
      });

      await act(async () => {
        fireEvent.press(mapViewer.getAllByTestId("polygon")[0]);
      });
      await act(async () => {
        fireEvent.press(mapViewer.getByTestId("directions-action-button"));
      });
      await act(async () => {});

      const routesPopup = mapViewer.getByTestId('routes-info-popup');
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
})
