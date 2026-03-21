import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import ClassDetailPopup from "./class-detail-popup";
import ScheduleHeader from "./schedule-header";
import WeeklyCalendarBody from "./weekly-calendar-body";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { ClassSchedule } from "@/hooks/use-calendar";
type ScheduleViewerProps = {
  data: readonly ClassSchedule[] | null | undefined;
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);

  // Take given date and 'rewind' to Sunday 00:00:00:00 of that week
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);

  return d;
}

function buildColorMap(classes: readonly ClassSchedule[]): Map<string, string> {
  // Build a color mapping for the classes in the user's class list
  const PALETTE = [
    "#5e0e16",
    "#193764",
    "#46243d",
    "#9f6619",
    "#19645b",
    "#823e42",
    "#ab435e",
    "#a36c70",
  ];

  const colorMap = new Map<string, string>();
  let colorIndex = 0;

  for (const cls of classes) {
    // Identifies class based on the code, so all lectures, tutorials, labs, and times share the same color
    // e.g. SOEN-345 applies to the Monday and Wednesday lectures, the tutorial, and the lab
    const key = `${cls.SUBJECT}-${cls.CATALOG_NBR}`;

    if (!colorMap.has(key)) {
      colorMap.set(key, PALETTE[colorIndex % PALETTE.length]);
      colorIndex++;
    }
  }

  return colorMap;
}

export default function ScheduleViewer({ data }: Readonly<ScheduleViewerProps>) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const colorMap = useMemo(() => buildColorMap(data || []), [data]);

  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getWeekStart(new Date()),
  );

  function handleTodayPress() {
    setCurrentWeekStart(getWeekStart(new Date()));
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.scheduleViewer.containerBackground },
      ]}
    >
      <ScheduleHeader
        currentWeekStart={currentWeekStart}
        onWeekChange={setCurrentWeekStart}
        onTodayPress={handleTodayPress}
      />

      <WeeklyCalendarBody
        weekStartDate={currentWeekStart}
        classes={data ? [...data] : []}
        colorMap={colorMap}
        onClassPress={setSelectedClass}
        onWeekChange={setCurrentWeekStart}
      />

      {selectedClass && (
        <ClassDetailPopup
          classInfo={selectedClass}
          colorMap={colorMap}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
