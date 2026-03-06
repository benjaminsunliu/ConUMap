import React, { useState, useRef, useEffect } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View, PanResponder } from 'react-native';
import DayColumn from './day-column';
import { ClassInfo } from './types';
import { CALENDAR_END_HOUR, CALENDAR_START_HOUR, COLUMN_TOTAL_HEIGHT, HOUR_HEIGHT, PIXELS_PER_MINUTE, TIME_GUTTER_WIDTH } from '@/constants/scheduleConstant';

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

const todayColor = "rgba(148, 142, 25, 0.1)"

function getCurrentTimeY(): number {
    const now = new Date();
    const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
    return minutesFromMidnight * PIXELS_PER_MINUTE;
}

export default function WeeklyCalendarBody({ weekStartDate, classes, onClassPress, onWeekChange }: WeeklyCalendarBodyProps) {
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
        <View style={styles.container} {...panResponder.panHandlers}>
            <View style={styles.headerRow}>
                <View style={styles.timeGutterSpacer} />

                {weekDates.map((date, i) => (
                    <View key={i} style={[styles.dayHeader, isToday(date) && {backgroundColor: todayColor}]}>
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
                ref={scrollViewRef}
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

                        <View style={[StyleSheet.absoluteFillObject, {height: COLUMN_TOTAL_HEIGHT}]}
                            pointerEvents='none'
                        >
                            <View style={[styles.currentTimeLine, {top: currentTimeY}]} pointerEvents='none'>
                                <View style={styles.currentTimeDot}/>
                                <View style={styles.currentTimeBar}/>
                            </View>
                        </View>

                        {weekDates.map((date, i) => (
                            <DayColumn 
                                key={i}
                                dayIndex={i}
                                isToday={isToday(date)}
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
    backgroundColor: '#fdfcea',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fdfcea',
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
    color: '#5e0e16',
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
    backgroundColor: '#5e0e16',
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
    backgroundColor: '#fdfcea',
  },
  timeLabelRow: {
    position: 'absolute',
    right: 6,
    alignItems: 'flex-end',
  },
  timeLabelText: {
    fontSize: 9,
    color: '#7d7d7d',
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
    backgroundColor: '#d4d4d4',
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
    backgroundColor: '#E53935',
    marginLeft: -4, // pulls the dot to overlap the left edge
  },
  currentTimeBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E53935',
  },
}); 