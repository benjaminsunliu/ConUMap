import ScheduleViewer from "@/components/schedule/schedule-viewer";
import AuthWebView from "@/components/authentication/AuthWebView";
import { ONE_WEEK_MS } from "@/constants/time";
import { useCalendar } from "@/hooks/use-calendar";
import { useIsLoggedIn, useLogin, useLogout } from "@/hooks/use-login";
import React, { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";

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
          <ScheduleViewer data={calendarData} />
        </View>
      </GestureDetector>
    );
  }

  // really important to not render the web view when you are not logged in
  return <AuthWebView onLogin={login} />;
}
