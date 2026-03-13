import React, { useState, useRef, useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View, PanResponder } from 'react-native';
import DayColumn from './day-column';
import { ClassInfo, Weekdays } from '@/types/calendarTypes';
import { CALENDAR_END_HOUR, CALENDAR_START_HOUR, COLUMN_TOTAL_HEIGHT, HOUR_HEIGHT, PIXELS_PER_MINUTE, TIME_GUTTER_WIDTH } from '@/constants/scheduleConstant';

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HOURS = Array.from(
    { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
    (_, i) => CALENDAR_START_HOUR + i
);

interface WeeklyCalendarBodyProps {
    weekStartDate: Date;
    classes: ClassInfo[];
    colorMap: Map<string, string>;
    onClassPress: (classInfo: ClassInfo) => void;
    onWeekChange: (newWeekStart: Date) => void;
}

function getCurrentTimeY(): number {
    const now = new Date();
    const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
    return minutesFromMidnight * PIXELS_PER_MINUTE;
}

export default function WeeklyCalendarBody({ weekStartDate, classes, colorMap, onClassPress, onWeekChange }: WeeklyCalendarBodyProps) {
    const colorScheme = useColorScheme() ?? "light";
    const theme = Colors[colorScheme];
    
    // Time state for horizontal time bar
    const [currentTimeY, setCurrentTimeY] = useState(() => getCurrentTimeY());
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTimeY(getCurrentTimeY());
        }, 60000);

        return () => clearInterval(interval);
    }, [])
    
    const today = new Date();

    // Allows the panResponder for handling horizontal swipes to have the most recent state of week start and week change
    const weekStartDateRef = useRef(weekStartDate);
    const onWeekChangeRef = useRef(onWeekChange);
    weekStartDateRef.current = weekStartDate;
    onWeekChangeRef.current = onWeekChange;

    // Defaults the schedule to display from 08:00 onwards, rather than from 00:00 onwards
    const scrollViewRef = useRef<ScrollView>(null);
    useEffect(() => {
        const timer = setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                y: 8 * HOUR_HEIGHT,
                animated: false,
            });
        }, 50);
        return () => clearTimeout(timer);
    }, []);


    const weekDates = Array.from({length: 7}, (_, i) => {
        const d = new Date(weekStartDate);
        d.setDate(weekStartDate.getDate() + i);
        return d;
    })

    const isToday = (date: Date) => 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
                Math.abs(gestureState.dx) > Math.abs(gestureState.dy),

            onPanResponderRelease: (_, gestureState) => {
                const SWIPE_THRESHOLD = 50;
                if (Math.abs(gestureState.dx) < SWIPE_THRESHOLD) return;

                // Read from the refs instead of the captured props
                const newDate = new Date(weekStartDateRef.current);
                newDate.setDate(newDate.getDate() + (gestureState.dx < 0 ? 7 : -7));
                onWeekChangeRef.current(newDate);
            },
        })
    ).current;

    return (
        <View style={[styles.container, {backgroundColor: theme.weeklyCalendarBody.backgroundColor}]} {...panResponder.panHandlers}>
            <View style={[styles.headerRow, {backgroundColor: theme.weeklyCalendarBody.backgroundColor, borderBottomColor: theme.weeklyCalendarBody.borderColor}]}>
                <View style={styles.timeGutterSpacer} />

                {weekDates.map((date, i) => (
                    <View key={i} style={[styles.dayHeader, {borderLeftColor: theme.weeklyCalendarBody.borderColor,}, isToday(date) && {backgroundColor: theme.weeklyCalendarBody.todayColor}]}>
                        <Text style={[styles.dayLabel, {color: theme.weeklyCalendarBody.dayAndTimeLabel}, isToday(date) && {color: theme.tint}]}>
                            {date.toLocaleDateString("en-US", { weekday: 'short' })}
                        </Text>
                        <View style={[styles.dateCircle, isToday(date) && {backgroundColor: theme.tint}]}>
                            <Text style={[styles.dateNumber, {color: theme.weeklyCalendarBody.dateNumber}, isToday(date) && {color: theme.weeklyCalendarBody.dateNumberToday}]}>
                                {date.getDate()}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.verticalScroll}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.bodyRow}>
                    <View style={[styles.timeGutter, {backgroundColor: theme.weeklyCalendarBody.backgroundColor}, { height: COLUMN_TOTAL_HEIGHT }]}>
                        {HOURS.map((hour) => (
                            <View key={hour} style={[styles.timeLabelRow, {top: hour * HOUR_HEIGHT - 8}]}>
                                <Text style={[styles.timeLabelText, {color: theme.weeklyCalendarBody.dayAndTimeLabel}]}>
                                    {String(hour).padStart(2, '0')}:00
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.columnsContainer}>
                        <View
                            style={[StyleSheet.absoluteFillObject, {height: COLUMN_TOTAL_HEIGHT}]}
                            pointerEvents='none'
                        >
                            {HOURS.map((hour) => (
                                <View key={hour} style={[styles.hourLine, {backgroundColor: theme.weeklyCalendarBody.hourLineColor}, {top: hour * HOUR_HEIGHT}]} />
                            ))}
                        </View>

                        <View style={[StyleSheet.absoluteFillObject, {height: COLUMN_TOTAL_HEIGHT}]}
                            pointerEvents='none'
                        >
                            {weekDates.some((date) => isToday(date)) &&(
                                <View style={[styles.currentTimeLine, {top: currentTimeY}]} pointerEvents='none'>
                                <View style={[styles.currentTimeDot, {backgroundColor: theme.weeklyCalendarBody.timeDotColor}]}/>
                                <View style={[styles.currentTimeBar, {backgroundColor: theme.weeklyCalendarBody.timeDotColor}]}/>
                            </View>)}
                        </View>

                        {weekDates.map((date, i) => (
                            <DayColumn 
                                key={i}
                                dayIndex={i}
                                isToday={isToday(date)}
                                classes={classes.filter((cls) => cls.DAY_OF_WEEK.includes(date.toLocaleDateString("en-US", { weekday: 'short' }).toLowerCase()))}
                                colorMap={colorMap}
                                onClassPress={onClassPress}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    )
    
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeGutterSpacer: {
    width: TIME_GUTTER_WIDTH,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dateCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  dateNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  verticalScroll: {
    flex: 1,
  },
  bodyRow: {
    flexDirection: 'row',
    width: SCREEN_WIDTH,
  },
  timeGutter: {
    width: TIME_GUTTER_WIDTH,
    position: 'relative',
  },
  timeLabelRow: {
    position: 'absolute',
    right: 6,
    alignItems: 'flex-end',
  },
  timeLabelText: {
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  currentTimeBar: {
    flex: 1,
    height: 1.5,
  },
}); 