import React from "react"
import BuildingInfoPopup from "../building-info-popup"
import { render } from "@testing-library/react-native";


describe('building-info-popup', () => { 
    it("renders nothing if building is null",()=>{
        const { queryByTestId } = render(<BuildingInfoPopup building={null} />);
  expect(queryByTestId("pop-upInfo")).toBeNull();
    });
      
      
 })