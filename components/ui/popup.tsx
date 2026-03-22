import React, { ReactElement, useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, ScrollView, View } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

interface Props {
  shouldDisplay: boolean;
  header: ReactElement;
  testID?: string;
}

const CLOSE_HEIGHT = 520;
const COLLAPSED_HEIGHT = 175;
const OPEN_TRANSLATE_Y = 0;
const COLLAPSED_TRANSLATE_Y = CLOSE_HEIGHT - COLLAPSED_HEIGHT;

export default function InfoPopup(props: React.PropsWithChildren<Props>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const styles = makeStyles(theme);

  const translateY = useRef(new Animated.Value(COLLAPSED_TRANSLATE_Y)).current;
  const currentTranslateY = useRef(COLLAPSED_TRANSLATE_Y);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (props.shouldDisplay) {
      Animated.spring(translateY, {
        toValue: COLLAPSED_TRANSLATE_Y,
        useNativeDriver: true,
      }).start(() => {
        currentTranslateY.current = COLLAPSED_TRANSLATE_Y;
      });
      setExpanded(false);
    } else {
      Animated.spring(translateY, {
        toValue: CLOSE_HEIGHT,
        useNativeDriver: true,
      }).start();
    }
  }, [props.shouldDisplay, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () =>
        translateY.stopAnimation((y) => {
          currentTranslateY.current = y;
        }),
      onPanResponderMove: (_, g) => {
        const next = Math.max(
          OPEN_TRANSLATE_Y,
          Math.min(COLLAPSED_TRANSLATE_Y, currentTranslateY.current + g.dy),
        );
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const midpoint = (OPEN_TRANSLATE_Y + COLLAPSED_TRANSLATE_Y) / 2;
        const expand = currentTranslateY.current + g.dy < midpoint || g.vy < -0.5;
        const snapPoint = expand ? OPEN_TRANSLATE_Y : COLLAPSED_TRANSLATE_Y;

        Animated.spring(translateY, {
          toValue: snapPoint,
          velocity: g.vy,
          tension: 80,
          friction: 14,
          useNativeDriver: true,
        }).start(() => {
          currentTranslateY.current = snapPoint;
        });
        setExpanded(expand);
      },
    }),
  ).current;

  if (!props.shouldDisplay) return null;

  return (
    <Animated.View
      testID={props.testID ?? "info-popup"}
      {...panResponder.panHandlers}
      style={[styles.card, { transform: [{ translateY }], height: CLOSE_HEIGHT }]}
    >
      <View style={styles.handle} />
      {props.header}
      <View style={styles.rule} />
      {expanded && <ScrollView style={styles.ScrollView}>{props.children}</ScrollView>}
    </Animated.View>
  );
}

const makeStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    card: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.buildingInfoPopup.background,
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      elevation: 15,
      zIndex: 10,
    },
    handle: {
      width: 40,
      height: 5,
      backgroundColor: theme.buildingInfoPopup.handle,
      borderRadius: 3,
      alignSelf: "center",
      marginBottom: 8,
    },
    rule: {
      borderBottomColor: theme.buildingInfoPopup.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      marginVertical: 12,
      zIndex: 10,
    },
    ScrollView: {
      marginTop: 10,
    },
  });
