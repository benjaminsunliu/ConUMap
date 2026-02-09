import React from "react"
import BuildingInfoPopup from "../components/map/building-info-popup"
import { render } from "@testing-library/react-native";

describe('building-info-popup', () => { 
    it("renders nothing if building is null",()=>{
      const { queryByTestId } = render(<BuildingInfoPopup building={null} />);
      expect(queryByTestId("info-popup")).toBeNull();
    });
 })