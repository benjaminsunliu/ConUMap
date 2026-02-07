import React from "react";
import LocationButton from '../location-button'
import {render, fireEvent} from '@testing-library/react-native'



describe('location button', () => { 

    test('when button is pressed onPress is called',()=>{
       const  onPress = jest.fn();
        const button = render(<LocationButton onPress={onPress} />)
        const locationButton = button.getByTestId('locationButton')
        fireEvent.press(locationButton);
        expect(onPress).toHaveBeenCalled();


        })
 })