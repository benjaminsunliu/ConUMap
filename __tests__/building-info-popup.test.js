import React from "react"
import BuildingInfoPopup from "../components/map/building-info-popup"
import { render } from "@testing-library/react-native";
import { concordiaBuildings } from "../data/parsedBuildings"

describe('building-info-popup', () => { 

    const testBuilding = concordiaBuildings[0];  // B Annex

    it("renders nothing if building is null",()=>{
      const { queryByTestId } = render(<BuildingInfoPopup building={null} />);
      expect(queryByTestId("info-popup")).toBeNull();
    });
    
    it("returns a non-null object if a valid building object is supplied", () => {
      const { queryByTestId } = render(<BuildingInfoPopup building={testBuilding} />);
      expect(queryByTestId("info-popup")).toBeDefined();
    });

    it("renders the correct popup for the supplied building", () => {
      const { getByText } = render(<BuildingInfoPopup building={testBuilding} />);
      
      expect(getByText('B – B Annex')).toBeTruthy();
      expect(getByText('SGW Campus | 2160 Bishop St.')).toBeTruthy();
      expect(getByText(/^Today:/)).toBeTruthy();
    })
 })