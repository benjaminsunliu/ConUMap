import React from "react"
import BuildingInfoPopup from "../components/map/building-info-popup"
import { render, screen, waitFor } from "@testing-library/react-native";
import { concordiaBuildings } from "../data/parsedBuildings"

const mockBuilding = concordiaBuildings[0];  // B Annex

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
        
        expect(getByText('B – B Annex')).toBeTruthy();
        expect(getByText('SGW Campus | 2160 Bishop St.')).toBeTruthy();
        expect(getByText(/^Today:/)).toBeTruthy();
    })
 })

 describe('building-info-popup-panresponder', () => {
    it('expands when dragging the past the midpoint', async () => {
        render(<BuildingInfoPopup building={mockBuilding}/>);

        const popup = screen.getByTestId('info-popup');

        popup.props.onResponderGrant({}, {});
        popup.props.onResponderMove({}, { dy: -300 });
        popup.props.onResponderRelease({}, { dy: -300, vy: -1 });

        const openingHoursTitle = await screen.findByText('Opening Hours');

        expect(openingHoursTitle).toBeTruthy();
    });

    it('stays collapsed when the drag is too small', async () => {
        render(<BuildingInfoPopup building={mockBuilding}/>);

        const popup = screen.getByTestId('info-popup');

        expect(screen.queryByText('Opening Hours')).toBeNull();  // Should initially be null

        popup.props.onResponderRelease({}, { dy: -50, vy: 0 });

        await waitFor(() => {
            expect(screen.queryByText('Opening Hours')).toBeNull();
        });
    });

 });