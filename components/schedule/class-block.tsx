import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { ClassSchedule } from "@/hooks/use-calendar";

interface ClassBlockProps {
  classInfo: ClassSchedule;
  colorMap: Map<string, string>;
  topOffset: number;
  height: number;
  onPress: (ClassInfo: ClassSchedule) => void;
}

export default function ClassBlock({
  classInfo,
  colorMap,
  topOffset,
  height,
  onPress,
}: Readonly<ClassBlockProps>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const courseKey = `${classInfo.SUBJECT}-${classInfo.CATALOG_NBR}`;
  const color = colorMap.get(courseKey) ?? theme.classBlock.courseNotInColorMap;

  return (
    <Pressable
      onPress={() => onPress(classInfo)}
      style={({ pressed }) => [
        styles.block,
        { shadowColor: theme.classBlock.shadowColor },
        {
          top: topOffset,
          height,
          backgroundColor: color,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[styles.courseName, { color: theme.classBlock.text }]}
          numberOfLines={1}
        >
          {classInfo.SUBJECT}
        </Text>
        <Text
          style={[styles.courseName, { color: theme.classBlock.text }]}
          numberOfLines={1}
        >
          {classInfo.CATALOG_NBR}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    position: "absolute",
    left: 1,
    right: 1,
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 3,
    paddingVertical: 2,
    justifyContent: "center",
  },
  courseName: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
