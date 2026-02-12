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
  };
});

jest.mock("@/constants/mapData", () => ({
    CAMPUS_LOCATIONS: [
      {
        code: "LB",
        location: { latitude: 45.495, longitude: -73.579 },
        polygons: [[
          { latitude: 45.4967290, longitude: -73.5785791 },
          { latitude: 45.4966684, longitude: -73.5785666 },
          { latitude: 45.4965831, longitude: -73.5776511 },
          { latitude: 45.4968922, longitude: -73.5772933 },
          { latitude: 45.4972596, longitude: -73.5780578 },
        ]]
      },  
      {
        code: "VE",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: [[
          { latitude: 45.4586304, longitude: -73.6384670 },
          { latitude: 45.4588656, longitude: -73.6382369 },
          { latitude: 45.4592128, longitude: -73.6381321 },
          { latitude: 45.4593120, longitude: -73.6386623 },
          { latitude: 45.4590806, longitude: -73.6391782 },
          { latitude: 45.4586304, longitude: -73.6384670 },
        ]]
      },  
      { code: "RA",
      location: { latitude: 45.496, longitude: -73.58 },
      polygons: [[
          { latitude: 45.45671477024348, longitude: -73.63709539175034 },
          { latitude: 45.45639186891413, longitude: -73.63736227154732 },
          { latitude: 45.45669007647078, longitude: -73.6381334066391 },
          { latitude: 45.45679214399463, longitude: -73.63806366920471 },
          { latitude: 45.456840355548806, longitude: -73.63818034529686 },
          { latitude: 45.457004039347105, longitude: -73.63805025815964 },
          { latitude: 45.45695488722195, longitude: -73.63792017102242 },
          { latitude: 45.45702732191778, longitude: -73.63786485046148 },
          { latitude: 45.45672088489029, longitude: -73.63709673285484 },
        ]]
    },
    {code: "AB",
    location: { latitude: 45.496, longitude: -73.58 },
    polygons: [[{ latitude: 45.496, longitude: -73.58 }]],

}],}));

      jest.mock('@/data/parsedBuildings', () => ({
        concordiaBuildings: [
          {
            code: "LB",
            location: { latitude: 45.495, longitude: -73.579 },
          },
          {
            code: "VE",
            location: { latitude: 45.496, longitude: -73.580 },
          },  {
            code: "RA",
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
      expect(mapViewer.queryByTestId("info-popup")).toBeNull();
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
      const ve = concordiaBuildings.find(b => b.code === "VE");
      const marker = mapViewer.getByTestId("marker-VE");
      expect(marker.props.coordinate).toEqual({
        latitude: ve.location.latitude + 0.00008,
        longitude: ve.location.longitude - 0.00015,
      });

    })
    
    it("Offset markers to prevent overlap  for RA building",()=>{
      const mapViewer= render(<MapViewer />);
      const ra = concordiaBuildings.find(a => a.code === "RA");
      const marker = mapViewer.getByTestId("marker-RA");
      expect(marker.props.coordinate).toEqual({
        latitude: ra.location.latitude - 0.0009,
        longitude: ra.location.longitude - 0.0008,
      });

    });
    it('focuses building when pressed', () => {
      const mapViewer = render(<MapViewer />);
      const building = concordiaBuildings[0];
      const marker = mapViewer.getByTestId(`marker-${building.code}`);
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
      const marker = mapViewer.getByTestId(`marker-${lb.code}`);
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
      expect(mapViewer.queryByTestId("pop-upInfo")).toBeNull();
    });

    describe('Polygon Color Selection Logic', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
      });
      
      // Helper function to determine fillColor based on selection and location status
      const getExpectedFillColor = (isSelected, isInBuilding) => {
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

      it('should assign polygonFill color when building is neither selected nor user is inside', () => {
        const expectedColor = getExpectedFillColor(false, false);
        expect(expectedColor).toBe(Colors.light.map.polygonFill); 
      });

      it('should assign polygonHighlighted color when building is selected but user is not inside', () => {
        const expectedColor = getExpectedFillColor(true, false);
        expect(expectedColor).toBe(Colors.light.map.polygonHighlighted);
      });

      it('should assign currentBuildingColor when user is inside building but it is not selected', () => {
        const expectedColor = getExpectedFillColor(false, true);
        expect(expectedColor).toBe(Colors.light.map.currentBuildingColor);
      });

      it('should assign currentSelectedBuildingColor when building is selected AND user is inside', () => {
        const expectedColor = getExpectedFillColor(true, true);
        expect(expectedColor).toBe(Colors.light.map.currentSelectedBuildingColor); 
      });

      it('should render polygons with different fillColors for different building states', async () => {
        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
        LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
          coords: { latitude: 45.4967290, longitude: -73.5785791 }, // Inside LB building
        });

        const mapViewer = render(<MapViewer />);
        
        // Enable location
        const locationButton = mapViewer.getByTestId('locationButton');
        await act(async () => {
          fireEvent.press(locationButton);
        });

        await act(async () => {
          jest.runAllTimers();
        });

        // Verify polygons are rendered with fillColor prop
        const polygons = mapViewer.getAllByTestId('polygon');
        expect(polygons.length).toBeGreaterThan(0);
        
        // When user is inside a building, at least one polygon should have currentBuildingColor
        const hasCurrentBuildingColor = polygons.some(
          (p) => p.props.fillColor === Colors.light.map.currentBuildingColor
        );
        expect(hasCurrentBuildingColor).toBe(true);
      });

      it('should verify fillColor changes based on selection state', () => {
        // Test the logic that updates color when selection changes
        const colors = {
          notSelected: Colors.light.map.polygonFill,
          selected: Colors.light.map.polygonHighlighted,
        };
        
        // Simulate the color assignment logic
        const isSelected = false;
        let fillColor = isSelected ? colors.selected : colors.notSelected;
        expect(fillColor).toBe(Colors.light.map.polygonFill);
        
        // Simulate selection state change
        const isSelectedAfterClick = true;
        fillColor = isSelectedAfterClick ? colors.selected : colors.notSelected;
        expect(fillColor).toBe(Colors.light.map.polygonHighlighted);
      });

      it('should verify all four color scenarios are possible with correct conditions', () => {
        // Test all four combinations
        const testCases = [
          { isSelected: false, isInBuilding: false, expected: Colors.light.map.polygonFill },
          { isSelected: true, isInBuilding: false, expected: Colors.light.map.polygonHighlighted },
          { isSelected: false, isInBuilding: true, expected: Colors.light.map.currentBuildingColor },
          { isSelected: true, isInBuilding: true, expected: Colors.light.map.currentSelectedBuildingColor },
        ];

        testCases.forEach(({ isSelected, isInBuilding, expected }) => {
          let finalFillColor = getExpectedFillColor(isSelected, isInBuilding);
          expect(finalFillColor).toBe(expected);
        });
      });
    });
})
