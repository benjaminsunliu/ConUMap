import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Building } from "../../data/building-info-data";
import { Ionicons } from '@expo/vector-icons';

interface Props {
  building: Building | null;
}

const FULL_HEIGHT = 520;
const COLLAPSED_HEIGHT = 175;
const EXPANDED_TRANSLATE_Y = 0;
const COLLAPSED_TRANSLATE_Y = FULL_HEIGHT - COLLAPSED_HEIGHT;

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function BuildingInfoCard({ building }: Props) {
  const translateY = useRef(new Animated.Value(COLLAPSED_TRANSLATE_Y)).current;
  const currentTranslateY = useRef(COLLAPSED_TRANSLATE_Y);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (building) {
      Animated.spring(translateY, { toValue: COLLAPSED_TRANSLATE_Y, useNativeDriver: true }).start(() => {
        currentTranslateY.current = COLLAPSED_TRANSLATE_Y;
      });
      setExpanded(false);
    } else {
      Animated.spring(translateY, { toValue: FULL_HEIGHT, useNativeDriver: true }).start();
    }
  }, [building]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => translateY.stopAnimation(value => currentTranslateY.current = value),
      onPanResponderMove: (_, g) => {
        let next = Math.max(EXPANDED_TRANSLATE_Y, Math.min(COLLAPSED_TRANSLATE_Y, currentTranslateY.current + g.dy));
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const midpoint = (EXPANDED_TRANSLATE_Y + COLLAPSED_TRANSLATE_Y) / 2;
        const expand = currentTranslateY.current + g.dy < midpoint || g.vy < -0.5;
        const snapPoint = expand ? EXPANDED_TRANSLATE_Y : COLLAPSED_TRANSLATE_Y;
        Animated.spring(translateY, { toValue: snapPoint, velocity: g.vy, tension: 80, friction: 14, useNativeDriver: true }).start(() => {
          currentTranslateY.current = snapPoint;
        });
        setExpanded(expand);
      },
    })
  ).current;

  if (!building) return null;

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const ACTIONS: { label: string; icon: string; type: "directions" | "call" | "website" }[] = [
    { label: "Directions", icon: "navigate-outline", type: "directions" },
    { label: "Call", icon: "call-outline", type: "call" },
    { label: "Website", icon: "globe-outline", type: "website" },
  ];

  const handleAction = (type: "directions" | "call" | "website") => {
    if (!building) return;
    const urlMap = {
      directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(building.address)}`,
      call: building.phone ? `tel:${building.phone}` : "",
      website: building.website || "",
    };
    urlMap[type] && Linking.openURL(urlMap[type]);
  };

  const renderList = (items: string[], icon: string = "checkmark-circle-outline") =>
    items.map((item, idx) => <ListItem key={idx} icon={icon} text={item} />);

  return (
    <Animated.View
    {...panResponder.panHandlers}
    style={[styles.card, {bottom: 0, transform: [{ translateY }], height: FULL_HEIGHT}]}>
      <View style={styles.handle} />
      <Text style={styles.title} numberOfLines={2}>{building.name}</Text>
      <Text style={styles.line}>{building.address}</Text>
      <Text style={styles.openStatus}>Today: {building.openingHours[todayIdx]}</Text>

      <View style={styles.actionsRow}>
        {ACTIONS.map(a => <ActionButton key={a.type} label={a.label} icon={a.icon} onPress={() => handleAction(a.type)} />)}
      </View>

      {expanded && (
        <ScrollView style={{ marginTop: 10 }}>
          <View style={styles.rule} />
          {building.accessibility.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Accessibility</Text>
              {renderList(building.accessibility)}
            </>
          )}

          <Text style={styles.sectionTitle}>Opening Hours</Text>
          {building.openingHours.map((h, idx) => (
            <Text key={idx} style={[styles.line, idx === todayIdx && { fontWeight: "700", color: "#1e8e3e" }]}> {WEEKDAYS[idx]}: {h} </Text>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

const ListItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.lineRow}>
    <Ionicons name={icon as any} size={18} color="#1e8e3e" style={{ marginRight: 6 }} />
    <Text style={styles.line}>{text}</Text>
  </View>
);

const ActionButton = ({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Ionicons name={icon as any} size={18} color="#1a73e8" style={{ marginRight: 6 }} />
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 10, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 15 },
  handle: { width: 40, height: 5, backgroundColor: "#ccc", borderRadius: 3, alignSelf: "center", marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 4 },
  openStatus: { color: "#1e8e3e", marginTop: 4, fontWeight: "500" },
  actionsRow: { flexDirection: "row", marginTop: 12, gap: 10 },
  actionButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#e8f0fe", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  actionText: { color: "#1a73e8", fontWeight: "500" },
  sectionTitle: { marginTop: 14, fontWeight: "600" },
  rule: { borderBottomColor: "#ddd", borderBottomWidth: StyleSheet.hairlineWidth, marginVertical: 12 },
  line: { color: "#333" },
  lineRow: { flexDirection: "row", alignItems: "center", marginTop: 2, marginLeft: 6 },
});
