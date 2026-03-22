import ScheduleViewer from "@/components/schedule/schedule-viewer";
import AuthWebView from "@/components/authentication/AuthWebView";
import { ONE_WEEK_MS } from "@/constants/time";
import { ClassSchedule, useCalendar } from "@/hooks/use-calendar";
import { useIsLoggedIn, useLogin, useLogout } from "@/hooks/use-login";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Text, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";

const WEEKDAY_ORDER: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function sortCalendarData(
  data: readonly ClassSchedule[] | null | undefined,
): ClassSchedule[] {
  if (!data) return [];

  return [...data].sort((a, b) => {
    const dayDiff =
      WEEKDAY_ORDER[a.DAY_OF_WEEK?.toLowerCase()] -
      WEEKDAY_ORDER[b.DAY_OF_WEEK?.toLowerCase()];
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
    data: calendarData,
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

  if (fetchingLogin || logginIn || logginOut || calendarLoading) {
    return (
      <View>
        <Text>Loading...</Text>
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
