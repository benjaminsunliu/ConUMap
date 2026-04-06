import ScheduleViewer from "@/components/schedule/schedule-viewer";
import AuthWebView from "@/components/authentication/AuthWebView";
import { ONE_WEEK_MS } from "@/constants/time";
import { ClassSchedule, useCalendar } from "@/hooks/use-calendar";
import { useIsLoggedIn, useLogin, useLogout } from "@/hooks/use-login";
import { DayOfWeek } from "@/types/dayOfWeek";
import React, { useEffect, useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";

function sortCalendarData(
  data: readonly ClassSchedule[] | null | undefined,
): ClassSchedule[] {
  if (!data) return [];

  return [...data].sort((a, b) => {
    const aDay = DayOfWeek.fromShortString(a.DAY_OF_WEEK);
    const bDay = DayOfWeek.fromShortString(b.DAY_OF_WEEK);
    const dayDiff = aDay - bDay;
    if (dayDiff !== 0) return dayDiff;

    const aStartMinutes = Number(a.START_HOURS) * 60 + Number(a.START_MINUTES);
    const bStartMinutes = Number(b.START_HOURS) * 60 + Number(b.START_MINUTES);
    if (aStartMinutes - bStartMinutes > 0) return 1;
    if (aStartMinutes - bStartMinutes < 0) return -1;
    return 0;
  });
}

export default function CalendarScreen() {
  const [date, setDate] = useState(new Date());
  const { isLoading: fetchingLogin, isLoggedIn } = useIsLoggedIn();
  const { isLoading: logginIn, login } = useLogin();
  const { isLoading: logginOut, logout } = useLogout();
  const {
    isLoading: calendarLoading,
    isFetching: calendarFetching,
    data: calendarData,
    error: calendarError,
    refetch: fetchCalendar,
  } = useCalendar(date);

  const sortedCalendarData = useMemo(
    () => sortCalendarData(calendarData),
    [calendarData],
  );

  // whoever is on UI should change this gesture because its a bit finnicky
  const swipeLeftGesture = Gesture.Fling()
    .direction(Directions.LEFT)
    .onStart(() => {
      setDate((currentDate) => new Date(currentDate.getTime() + ONE_WEEK_MS));
    })
    .runOnJS(true); // must run on js when you are trying to set a state in js

  const swipeRightGesture = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart(() => {
      setDate((currentDate) => new Date(currentDate.getTime() - ONE_WEEK_MS));
    })
    .runOnJS(true);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCalendar();
    }
  }, [isLoggedIn, date, fetchCalendar]);

  if (fetchingLogin || logginIn || logginOut || calendarLoading || calendarFetching) {
    return (
      <View style={styles.stateContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isLoggedIn && calendarError) {
    return (
      <View style={styles.stateContainer} testID="calendar-error-view">
        <Text style={styles.errorTitle}>Couldn't load your calendar.</Text>
        <Text style={styles.errorMessage}>
          {calendarError instanceof Error
            ? calendarError.message
            : "Try signing in again."}
        </Text>
        <View style={styles.errorActions}>
          <Button title="Try Again" onPress={() => fetchCalendar()} />
          <Button title="Logout" onPress={() => logout()} />
        </View>
      </View>
    );
  }

  if (isLoggedIn) {
    return (
      <GestureDetector gesture={Gesture.Race(swipeLeftGesture, swipeRightGesture)}>
        <View style={{ flex: 1 }} testID="courses-view">
          <Button title="Logout" onPress={() => logout()} />
          <ScheduleViewer data={sortedCalendarData} date={date} setDate={setDate} />
        </View>
      </GestureDetector>
    );
  }

  // really important to not render the web view when you are not logged in
  return <AuthWebView onLogin={login} />;
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  errorActions: {
    width: "100%",
    maxWidth: 280,
    gap: 12,
  },
});
