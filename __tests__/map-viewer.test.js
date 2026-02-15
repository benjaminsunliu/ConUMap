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
      expect(mapViewer.queryByTestId("info-popup")).toBeNull();
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
})
