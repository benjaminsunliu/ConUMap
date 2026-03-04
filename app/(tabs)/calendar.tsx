import { FlatList, Text, View } from "react-native";

import { AuthContext } from "@/components/authentication/AuthContextProvider";
import AuthWebView from "@/components/authentication/AuthWebView";
import { ClassSchedule, fetchCalendarForDate } from "@/hooks/use-calendar";
import React, { useContext, useEffect, useState } from "react";

export default function TabTwoScreen() {
  const authContext = useContext(AuthContext);
  const [data, setData] = useState<ClassSchedule[]>([]);

  useEffect(() => {
    const a = async () => {
      if (!authContext.isLoggedIn) {
        return;
      }
      const newData = await fetchCalendarForDate(authContext.data.authToken, new Date());
      debugger;
      console.log("Getting new data");
      setData(newData.scheduleList || []);
    };
    a();
  }, []);

  return authContext.isLoggedIn ? (
    <View>
      <Text>You are logged in!</Text>
      <FlatList
        data={data}
        renderItem={(info) => (
          <View>
            <Text>
              {info.item.SUBJECT}
              {info.item.CATALOG_NBR} - {info.item.CU_BUILDING}
              {info.item.ROOM}
            </Text>
          </View>
        )}
      />
    </View>
  ) : (
    <AuthWebView
      onLogin={async (loggedInData) => {
        const newData = await fetchCalendarForDate(loggedInData.authToken, new Date());
        setData(newData.scheduleList || []);
      }}
    />
  );
}
