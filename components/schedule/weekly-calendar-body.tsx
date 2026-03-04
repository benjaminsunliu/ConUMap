import React, { useState, useRef, useEffect } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View, PanResponder } from 'react-native';
import DayColumn from './day-column';
import { ClassInfo } from './types';
import { CALENDAR_END_HOUR, CALENDAR_START_HOUR, COLUMN_TOTAL_HEIGHT, HOUR_HEIGHT, TIME_GUTTER_WIDTH } from './constants';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SCREEN_WIDTH = Dimensions.get("window").width;
const HOURS = Array.from(
    { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
    (_, i) => CALENDAR_START_HOUR + i
);

interface WeeklyCalendarBodyProps {
    weekStartDate: Date;
    classes: ClassInfo[];
    onClassPress: (classInfo: ClassInfo) => void;
    onWeekChange: (newWeekStart: Date) => void;
}

export default function WeeklyCalendarBody({ weekStartDate, classes, onClassPress, onWeekChange }: WeeklyCalendarBodyProps) {
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
        <View style={styles.container} {...panResponder.panHandlers}>
            <View style={styles.headerRow}>
                <View style={styles.timeGutterSpacer} />

                {weekDates.map((date, i) => (
                    <View key={i} style={styles.dayHeader}>
                        <Text style={[styles.dayLabel, isToday(date) && styles.dayLabelToday]}>
                            {WEEK_DAYS[date.getDay()]}
                        </Text>
                        <View style={[styles.dateCircle, isToday(date) && styles.dateCircleToday]}>
                            <Text style={[styles.dateNumber, isToday(date) && styles.dateNumberToday]}>
                                {date.getDate()}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            <ScrollView
                style={styles.verticalScroll}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.bodyRow}>
                    <View style={[styles.timeGutter, { height: COLUMN_TOTAL_HEIGHT }]}>
                        {HOURS.map((hour) => (
                            <View key={hour} style={[styles.timeLabelRow, {top: hour * HOUR_HEIGHT - 8}]}>
                                <Text style={styles.timeLabelText}>
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
                                <View key={hour} style={[styles.hourLine, {top: hour * HOUR_HEIGHT}]} />
                            ))}
                        </View>

                        {weekDates.map((date, i) => (
                            <DayColumn 
                                key={i}
                                dayIndex={i}
                                classes={classes.filter((cls) => cls.dayOfWeek.includes(date.getDay()))}
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
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  timeGutterSpacer: {
    width: TIME_GUTTER_WIDTH,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#E0E0E0',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dayLabelToday: {
    color: '#1A73E8',
  },
  dateCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  dateCircleToday: {
    backgroundColor: '#1A73E8',
  },
  dateNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  dateNumberToday: {
    color: '#fff',
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
    backgroundColor: '#fff',
  },
  timeLabelRow: {
    position: 'absolute',
    right: 6,
    alignItems: 'flex-end',
  },
  timeLabelText: {
    fontSize: 9,
    color: '#aaa',
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
    backgroundColor: '#E8E8E8',
  },
}); 