import React from "react"
import BuildingInfoPopup from "../components/map/building-info-popup"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { concordiaBuildings } from "../data/parsedBuildings"
import { Linking } from 'react-native';

const mockBuilding = concordiaBuildings[14];  // Hall Building

jest.mock('react-native', () => {
    const rn = jest.requireActual('react-native');
    
    rn.PanResponder.create = (config) => ({
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

const mockOnNavigate = jest.fn();

jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn());
jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);


describe('building-info-popup', () => { 
    it("renders nothing if building is null",()=>{
        const { queryByTestId } = render(<BuildingInfoPopup building={null} />);
        expect(queryByTestId("info-popup")).toBeNull();
    });
    
    it("returns a non-null object if a valid building object is supplied", () => {
        const { queryByTestId } = render(<BuildingInfoPopup building={mockBuilding} />);
        expect(queryByTestId("info-popup")).toBeDefined();
    });

    it("renders the correct popup for the supplied building", () => {
        const { getByText } = render(<BuildingInfoPopup building={mockBuilding} />);
        
        expect(getByText('H – Henry F. Hall Building')).toBeTruthy();
        expect(getByText('SGW Campus | 1455 De Maisonneuve Blvd. W.')).toBeTruthy();
        expect(getByText(/^Today:/)).toBeTruthy();
    });

    it('calls the on navigate function when "Directions" is pressed', async () => {
        render(<BuildingInfoPopup building={mockBuilding} onNavigate={mockOnNavigate}/>);

        const directionsButton = screen.getByTestId('directions-action-button');

        await act(async () => {
            await fireEvent.press(directionsButton);
        });
        
        expect(mockOnNavigate).toHaveBeenCalled();
    });

    it('opens the correct link when "Website" is pressed', async () => {
        render(<BuildingInfoPopup building={mockBuilding} onNavigate={mockOnNavigate}/>);

        const websiteButton = screen.getByTestId('website-action-button');
        await act(async () => {
            await fireEvent.press(websiteButton);
        });
        
        expect(Linking.openURL).toHaveBeenCalledWith(mockBuilding.link);
    });
});

describe('building-info-popup-panresponder', () => {
    it('expands when dragging the past the midpoint', async () => {
        render(<BuildingInfoPopup building={mockBuilding}/>);

        const popup = screen.getByTestId('info-popup');

        await act(async () => {
            popup.props.onResponderGrant({}, {});
            popup.props.onResponderMove({}, { dy: -300 });
            popup.props.onResponderRelease({}, { dy: -300, vy: -1 });
        });

        const openingHoursTitle = await screen.findByText('Opening Hours');

        expect(openingHoursTitle).toBeTruthy();
    });

    it('stays collapsed when the drag is too small', async () => {
        render(<BuildingInfoPopup building={mockBuilding}/>);

        const popup = screen.getByTestId('info-popup');

        expect(screen.queryByText('Opening Hours')).toBeNull();  // Should initially be null
        
        await act(async () => {
        popup.props.onResponderRelease({}, { dy: -50, vy: 0 });
        });

        await waitFor(() => {
            expect(screen.queryByText('Opening Hours')).toBeNull();
        });
    });

});