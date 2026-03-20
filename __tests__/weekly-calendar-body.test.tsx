import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WeeklyCalendarBody, {getNextClass} from '../components/schedule/weekly-calendar-body';
import { ClassInfo } from '../types/calendarTypes';

describe('getNextClass', () => {
    it('returns null if there are no classes today', () => {

    })

    it('finds the next class if no classes are in progress', () => {

    })

    it('chooses an ongoing class as the next class if it started 30 minutes ago or less', () => {

    })

    it('skips an ongoing class if it started more than 30 minutes ago', () => {
        
    })
})