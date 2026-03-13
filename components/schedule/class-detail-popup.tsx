import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "expo-router";
import { getWeekdayKey, ClassInfo } from "@/types/calendarTypes";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

interface ClassDetailPopupProps {
  classInfo: ClassInfo;
  colorMap: Map<string, string>;
  onClose: () => void;
}

export default function ClassDetailPopup({
  classInfo,
  colorMap,
  onClose,
}: ClassDetailPopupProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(backdropOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const navigation = useNavigation<any>();

  const courseKey = `${classInfo.SUBJECT}-${classInfo.CATALOG_NBR}`;
  const color = colorMap.get(courseKey) ?? theme.classDetailPopup.courseNotInColorMap;

  function handleClose() {
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  function handleLocateOnMap() {
    onClose();
    navigation.navigate("map-tab", {
      buildingId: classInfo.CU_BLDG,
    });
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, {backgroundColor: theme.classDetailPopup.backdropColor, opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Pressable style={[styles.card, { backgroundColor: color, shadowColor: theme.classDetailPopup.cardShadowColor }]}>
          <View style={styles.body}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={[styles.courseCode, {color: theme.classDetailPopup.text}]}>
                  {classInfo.SUBJECT} {classInfo.CATALOG_NBR}
                </Text>
                <Text style={[styles.xlatLongName, {color: theme.classDetailPopup.text}]}>
                  {classInfo.XLATLONGNAME} – Section {classInfo.CLASS_SECTION}
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                style={[styles.closeButton, {backgroundColor: "none"}]}
                accessibilityLabel="Close"
              >
                <MaterialIcons name="close" size={36} color={theme.classDetailPopup.buttonColor} />
              </Pressable>
            </View>
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailRowTitle, {color: theme.classDetailPopup.text}]}>Instructor:</Text>
                <Text style={[styles.detailRowText, {color: theme.classDetailPopup.text}]}>{classInfo.INSTR_NAME}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailRowTitle, {color: theme.classDetailPopup.text}]}>Time:</Text>
                <Text style={[styles.detailRowText, {color: theme.classDetailPopup.text}]}>
                  {classInfo.START_HOURS}:{classInfo.START_MINUTES} –{" "}
                  {classInfo.END_HOURS}:{classInfo.END_MINUTES} (
                  {getWeekdayKey(classInfo.DAY_OF_WEEK)})
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailRowTitle, {color: theme.classDetailPopup.text}]}>Location:</Text>
                <Text style={[styles.detailRowText, {color: theme.classDetailPopup.text}]}>
                  Room {classInfo.CU_BLDG + "-" + classInfo.ROOM}
                </Text>
                <Text style={[styles.detailRowText, {color: theme.classDetailPopup.text}]}>{classInfo.CU_BUILDING}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleLocateOnMap}
              style={({ pressed }) => [styles.mapButton, {backgroundColor: theme.classDetailPopup.buttonColor, opacity: pressed ? 0.85 : 1 }]}
              accessibilityLabel={`Find ${classInfo.CU_BLDG}${classInfo.ROOM} on map`}
            >
              <Text style={[styles.mapButtonText, {color: theme.classDetailPopup.mapButtonText}]}>View in Map</Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 18,
    maxHeight: "75%",
    overflow: "hidden",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    alignSelf: "stretch",
  },
  body: {
    padding: 20,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
    marginBottom: 18,
  },
  courseCode: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  xlatLongName: {
    fontSize: 20,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    marginBottom: 4,
  },
  detailRow: {
    marginBottom: 26,
  },
  detailRowTitle: {
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 10,
  },
  detailRowText: {
    fontSize: 16,
    marginBottom: 6,
  },
  mapButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  mapButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
