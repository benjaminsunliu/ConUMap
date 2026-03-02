// TODO: Setup all files and exports with props and handlers

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import ClassDetailPopup from "./class-detail-popup";
import ScheduleHeader from "./schedule-header";
import WeeklyCalendarBody from "./weekly-calendar-body";
import { MOCK_CLASSES } from './MOCK-DATA';
import { ClassInfo } from "./types";

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    
    // Take given date and 'rewind' to Sunday 00:00:00:00 of that week
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);

    return d;
}

export default function ScheduleViewer() {
    const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));

    const classes = MOCK_CLASSES;

    function handleTodayPress() {
        // 'Today' button
        setCurrentWeekStart(getWeekStart(new Date()));
    }

    function handleSettingsPress() {
        // Open settings modal
    }

    return (
        <ClassDetailPopup />
    );
}

/* <View>
    <ScheduleHeader
        currentWeekStart={currentWeekStart}
        onWeekChange={setCurrentWeekStart}
        onTodayPress={handleTodayPress}
        onSettingsPress={handleSettingsPress}
    />
    <WeeklyCalendarBody
        weekStartDate={currentWeekStart}
        classes={classes}
        onClassPress={setSelectedClass}
    />

    {selectedClass && (
        <ClassDetailPopup class={selectedClass} onClose={() => selectedClass(null)} />
    )}
</View> */