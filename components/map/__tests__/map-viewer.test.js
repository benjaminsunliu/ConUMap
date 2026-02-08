import React from "react";
import {render, fireEvent,waitFor} from '@testing-library/react-native';
import * as LocationPermissions from 'expo-location';
import { CAMPUS_LOCATIONS } from "@/constants/mapData";
import { concordiaBuildings } from "@/data/parsedBuildings";
import MapViewer from '../map-viewer';

const mockAnimateToRegion = jest.fn();

jest.mock('react-native-map-clustering', () => {
  const React = require('react');
  const { forwardRef, useImperativeHandle } = React;
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: forwardRef((props, ref) => {
      useImperativeHandle(ref, () => ({
        animateToRegion: mockAnimateToRegion,
      }));
      return <View {...props}>{props.children}</View>;
    }),
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
        polygons: [[{ latitude: 45.495, longitude: -73.579 }]],
      },  
      {
        code: "VE",
        location: { latitude: 45.496, longitude: -73.58 },
        polygons: [[{ latitude: 45.496, longitude: -73.58 }]],
      
      },  
      { code: "RA",
      location: { latitude: 45.496, longitude: -73.58 },
      polygons: [[{ latitude: 45.496, longitude: -73.58 }]],
  
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
        mapView.getByTestId('map-view')
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

    it('if location state is off it will request location ', async () => {

        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
        LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
            coords: { latitude: 45.49575, longitude:  -73.5793055556 },
        });

        const mapViewer = render(<MapViewer />);

        const locationButton = mapViewer.getByTestId('locationButton')
        await fireEvent.press(locationButton);
         
        expect(mockAnimateToRegion).not.toHaveBeenCalled();
        expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
        expect(LocationPermissions.requestForegroundPermissionsAsync).toHaveBeenCalled();
        expect(LocationPermissions.getCurrentPositionAsync).not.toHaveBeenCalled();

      });

      it('if location state is off and ForegroundPermissions not granted it could try to getCurrentPositionAsync ', async () => {

        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(true);
        LocationPermissions.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'refused' });
        LocationPermissions.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 45.49575, longitude: -73.5793055556  },
        });
       const mapViewer = render(<MapViewer />);

       const locationButton = mapViewer.getByTestId('locationButton')
       await fireEvent.press(locationButton);
        
       expect(mockAnimateToRegion).not.toHaveBeenCalled();
       expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
       expect(LocationPermissions.requestForegroundPermissionsAsync).toHaveBeenCalled();
       expect(LocationPermissions.getCurrentPositionAsync).toHaveBeenCalled();

     });

     it('if location state is on  it will center location ', async () => {

       const mapViewer = render(<MapViewer />);
       const mapView = mapViewer.getByTestId('map-view');
        //user location updates which makes locationState on
       fireEvent(mapView, 'onUserLocationChange', {
        nativeEvent: { coordinate: { latitude: 45.49575, longitude: -73.5793055556  } },
      });
         const locationButton = mapViewer.getByTestId('locationButton')
         await fireEvent.press(locationButton);
         expect(mockAnimateToRegion).toHaveBeenCalled();

     });

     it('if location state is off , locationEnabled is false and location button is pressed, modalOpen will be true ', async () => {

        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(false);
        const mapViewer = render(<MapViewer />);
        const locationButton = mapViewer.getByTestId('locationButton')
         fireEvent.press(locationButton);
       expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
       const modal = await mapViewer.findByTestId('location-modal');
       expect(modal).toBeVisible();

     });
    

      it('closes modal if onRequestClose is called ', async()=>{
        
        const mapViewer = render(<MapViewer />);
        const locationButton = mapViewer.getByTestId('locationButton')

        await fireEvent.press(locationButton);
        const modal = await mapViewer.findByTestId("location-modal");
        expect(modal).toBeVisible();
        fireEvent(modal, "onRequestClose");
        const modal_ = mapViewer.queryByTestId("location-modal");
        expect(modal_).not.toBeVisible();

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
        userLocationDelta = {  latitudeDelta: 0.00922,
            longitudeDelta: 0.00421}
        const mapViewer = render(<MapViewer   userLocationDelta={{ userLocationDelta }}
            initialRegion={{ latitude: 45.49575, longitude: -73.5793055556, latitudeDelta: 0.0922,
                longitudeDelta: 0.0922, }}/>);
        const mapView = mapViewer.getByTestId('map-view');
        fireEvent(mapView, 'onUserLocationChange', {
        nativeEvent: { coordinate: { latitude: 45.49575, longitude: -73.5793055556 } },
        });
        const locationButton = mapViewer.getByTestId('locationButton')
        await fireEvent.press(locationButton);
        expect(mapView.props.followsUserLocation).toBe(true);
        fireEvent(mapView, "panDrag");
        //no longer following user because dragged
        expect(mapView.props.followsUserLocation).toBe(false);



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
      const building = concordiaBuildings[0];
      const polygons = mapViewer.getAllByTestId("polygon");
      await fireEvent.press(polygons[0]);
          const map = mapViewer.getByTestId("map-view");
      fireEvent(map, "press", {
        nativeEvent: { action: "press" },
      });

      expect(mapViewer.queryByTestId("pop-upInfo")).toBeNull();
  
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
        latitude: ra.location.latitude - 0.00008,
        longitude: ra.location.longitude - 0.00015,
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
      const mapView = mapViewer.getByTestId("map-view");

      const markerAB = mapViewer.getByTestId("marker-AB");
      fireEvent.press(markerAB);
      expect(mapViewer.queryByTestId("pop-upInfo")).toBeNull();

    });
   


  



})
