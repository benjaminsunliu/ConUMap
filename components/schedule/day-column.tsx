import React from "react";
import { StyleSheet, View } from "react-native";
import ClassBlock from "./class-block";
import { COLUMN_TOTAL_HEIGHT } from "@/constants/scheduleConstant";
import { ClassInfo } from "@/types/calendarTypes";
import { timeToPixels } from "@/constants/scheduleConstant";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

interface DayColumnProps {
  dayIndex: number;
  isToday: boolean;
  classes: ClassInfo[];
  colorMap: Map<string, string>;
  onClassPress: (classInfo: ClassInfo) => void;
}

export default function DayColumn({
  dayIndex,
  isToday,
  classes,
  colorMap,
  onClassPress,
}: DayColumnProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  
  return (
    <View style={[styles.column, {borderLeftColor: theme.dayColumn.borderColor}, isToday && { backgroundColor: theme.dayColumn.todayColor }]}>
      <View style={[styles.eventsArea, { height: COLUMN_TOTAL_HEIGHT }]}>
        {classes.map((cls) => {
          
          let topOffset = timeToPixels(`${cls.START_HOURS}:${cls.START_MINUTES}`, "start");
          let height = timeToPixels(`${cls.END_HOURS}:${cls.END_MINUTES}`, "end") - topOffset;

          return (<ClassBlock
            key={`${dayIndex}-${cls.SUBJECT}${cls.CATALOG_NBR}-${cls.START_HOURS}${cls.START_MINUTES}`}
            classInfo={cls}
            colorMap={colorMap}
            topOffset={topOffset}
            height={height}
            onPress={onClassPress}
          />)
    
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  eventsArea: {
    position: "relative",
  },
});
