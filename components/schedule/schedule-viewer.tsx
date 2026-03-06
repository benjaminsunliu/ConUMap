import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import ClassDetailPopup from "./class-detail-popup";
import ScheduleHeader from "./schedule-header";
import WeeklyCalendarBody from "./weekly-calendar-body";
import { MOCK_CLASSES } from './MOCK-DATA';
import { ClassInfo } from "@/types/calendarTypes";

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    
    // Take given date and 'rewind' to Sunday 00:00:00:00 of that week
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);

    return d;
}

function buildColorMap(classes: ClassInfo[]): Map<string, string> {
    // Build a color mapping for the classes in the user's class list
    const PALETTE = ["#5e0e16", "#193764", "#46243d", "#9f6619", "#19645b", "#823e42", "#ab435e", "#a36c70",];

    const colorMap = new Map<string, string>();
    let colorIndex = 0;

    for (const cls of classes) {
        // Uniquely identifies a class based on code and ssr component, but is shared across days of the week
        // e.g. SOEN-345-LEC applies to the Monday and Wednesday lectures
        const key = `${cls.SUBJECT}-${cls.CATALOG_NBR}-${cls.SSR_COMPONENT}`;
        
        if (!colorMap.has(key)) {
            colorMap.set(key, PALETTE[colorIndex % PALETTE.length]);
            colorIndex++;
        }
    }

    return colorMap;
}

export default function ScheduleViewer() {
    const classes = MOCK_CLASSES;   // WILL NEED TO BE REPLACED WITH API
    const colorMap = useMemo(() => buildColorMap(classes), [classes]);

    const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));

    function handleTodayPress() {
        setCurrentWeekStart(getWeekStart(new Date()));
    }

    function handleSettingsPress() {
        // Open settings modal
    }

    return (
        <View style={styles.container}>
            <ScheduleHeader
                currentWeekStart={currentWeekStart}
                onWeekChange={setCurrentWeekStart}
                onTodayPress={handleTodayPress}
                onSettingsPress={handleSettingsPress}
            />

            <WeeklyCalendarBody
                weekStartDate={currentWeekStart}
                classes={classes}
                colorMap={colorMap}
                onClassPress={setSelectedClass}
                onWeekChange={setCurrentWeekStart}
            />

            {selectedClass && (
                <ClassDetailPopup 
                    classInfo={selectedClass}
                    onClose={() => setSelectedClass(null)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff"
    }
})