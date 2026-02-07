import React from "react"
import {render, fireEvent, act} from '@testing-library/react-native'
import MapViewer from '../map-viewer'
import * as LocationPermissions from 'expo-location';
import { animateToRegionMock } from 'react-native-maps';



jest.mock('expo-location', () => ({
    hasServicesEnabledAsync: jest.fn(),
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
  }));

  jest.mock('react-native-maps', () => {
    const React = require('react');
    const { View } = require('react-native');
  
    // mock function
    const animateToRegionMock = jest.fn();
  
    const MapView = React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        animateToRegion: animateToRegionMock, 
      }));
      return <View {...props}>{props.children}</View>;
    });
  
    const Polygon = (props) => <View {...props} />;
  
    return {
      __esModule: true,
      default: MapView,
      Polygon,
      animateToRegionMock,
    };
  });

describe('map tab',()=>{
    it(' should display the map',()=>{
        const mapView = render(<MapViewer/>)
        mapView.getByTestId('map-view')
    });

    it(' should display the polygons on the map ',()=>{
        const mapView = render(<MapViewer />);
        const polygons = mapView.getAllByTestId('polygon');
        expect(polygons.length).toBe(69);  


    })

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
         
        expect(animateToRegionMock).not.toHaveBeenCalled();
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
        
       expect(animateToRegionMock).not.toHaveBeenCalled();
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
         expect(animateToRegionMock).toHaveBeenCalled();

     });

     it('if location state is off , locationEnabled is false and location button is pressed, modalOpen will be true ', async () => {

        LocationPermissions.hasServicesEnabledAsync.mockResolvedValue(false);
     
        const mapViewer = render(<MapViewer />);

        const locationButton = mapViewer.getByTestId('locationButton')
        await fireEvent.press(locationButton);
        
       expect(LocationPermissions.hasServicesEnabledAsync).toHaveBeenCalled();
       const modal = await mapViewer.findByTestId('location-modal');
       expect(modal).toBeVisible();

     });
    
     it('if location state is on it will center the location ',  () => {
        const mapViewer = render(<MapViewer />);
        const mapView = mapViewer.getByTestId('map-view');

         //user location updates which makes locationState on
        fireEvent(mapView, 'onUserLocationChange', {
            nativeEvent: { coordinate: { latitude: 45.49575, longitude: -73.5793055556  } },
        });
   
          expect(animateToRegionMock).toHaveBeenCalled();
 
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



      })


})
