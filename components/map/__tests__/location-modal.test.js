import React from "react";
import LocationModal from "../location-modal";
import {render, fireEvent} from '@testing-library/react-native'



describe('location modal',()=>{
    it('should display text when visible',()=>{
        const modal = render(<LocationModal visible={true} onRequestClose={jest.fn()}/>)
        expect(modal.getByText("Please turn on your location settings")).toBeOnTheScreen();

    });

    it('should close when Okay is pressed',()=>{
        const onRequestClose = jest.fn();
        const modal = render(<LocationModal visible={true} onRequestClose={onRequestClose}/>)
        fireEvent.press(modal.getByText('Okay'));
        expect(onRequestClose).toHaveBeenCalled();
    
    });
})