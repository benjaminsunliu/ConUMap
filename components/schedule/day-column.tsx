import React from "react";
import { StyleSheet, View } from "react-native";
import ClassBlock from "./class-block";
import { COLUMN_TOTAL_HEIGHT } from "@/constants/scheduleConstant";
import { ClassInfo } from "@/types/calendarTypes";

interface DayColumnProps {
  dayIndex: number;
  isToday: boolean;
  classes: ClassInfo[];
  colorMap: Map<string, string>;
  onClassPress: (classInfo: ClassInfo) => void;
}

const todayColor = "rgba(148, 142, 25, 0.1)";

export default function DayColumn({
  dayIndex,
  isToday,
  classes,
  colorMap,
  onClassPress,
}: DayColumnProps) {
  return (
    <View style={[styles.column, isToday && { backgroundColor: todayColor }]}>
      <View style={[styles.eventsArea, { height: COLUMN_TOTAL_HEIGHT }]}>
        {classes.map((cls) => (
          <ClassBlock
            key={`${dayIndex}-${cls.SUBJECT}-${cls.CATALOG_NBR}`}
            colorMap={colorMap}
            classInfo={cls}
            onPress={onClassPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#E0E0E0",
  },
  eventsArea: {
    position: "relative",
  },
});
