import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BuildingFloorInfo, IndoorNavigationPath } from "@/types/mapTypes";
import { useMemo, useRef } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

interface BuildingFloorProps {
  info: BuildingFloorInfo;
  floor: number;
  navigationPath?: IndoorNavigationPath;
  isStepMode?: boolean;
  activeStepIndex?: number;
}

export default function BuildingFloor({
  info,
  floor,
  navigationPath,
  isStepMode = false,
  activeStepIndex = 0,
}: Readonly<BuildingFloorProps>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const navigationPathColor = theme.map.navigationPathColor;
  const activeStepOutlineColor = theme.map.currentSelectedBuildingColor;
  const viewContainerRef = useRef(null);

  const imageSize = useMemo(() => {
    const imageInfo = Image.resolveAssetSource(info.images[floor]);
    return imageInfo?.width && imageInfo?.height
      ? { width: imageInfo.width, height: imageInfo.height }
      : { width: 0, height: 0 };
  }, [info.images, floor]);

  const nodes = useMemo(() => {
    if (!viewContainerRef) {
      return null;
    }
    return Object.values(info.graphData.checkpoints)
      .filter((floorCheckpoint) => {
        return floorCheckpoint.floor === floor;
      })
      .map((floorCheckpoint) => {
        return (
          <Circle
            key={floorCheckpoint.id}
            fill="blue"
            stroke="green"
            strokeWidth="5"
            cx={floorCheckpoint.x}
            cy={floorCheckpoint.y}
            r="10"
          />
        );
      });
  }, [viewContainerRef, info.graphData.checkpoints, floor]);

  const lines = useMemo(() => {
    if (!navigationPath) {
      return null;
    }

    const activeEdgeIndex = isStepMode
      ? Math.min(Math.max(activeStepIndex, 0), Math.max(navigationPath.length - 2, 0))
      : -1;
    const checkpoints = info.graphData.checkpoints;
    const result = [];
    for (let i = 0; i < navigationPath.length - 1; i++) {
      const current = checkpoints[navigationPath[i]];
      const next = checkpoints[navigationPath[i + 1]];
      if (!current || !next) {
        continue;
      }
      if (current.floor !== floor || next.floor !== floor) {
        continue;
      }
      const isActiveEdge = isStepMode && i === activeEdgeIndex;

      if (isActiveEdge) {
        result.push(
          <Line
            key={`active-outline-${current.id}-${next.id}-${floor}`}
            x1={current.x}
            y1={current.y}
            x2={next.x}
            y2={next.y}
            stroke={activeStepOutlineColor}
            strokeWidth={30}
            strokeOpacity={0.3}
            strokeLinecap="round"
          />,
        );
      }
      result.push(
        <Line
          key={`${current.id}-${next.id}-${floor}`}
          testID={`indoor-path-edge-${i}`}
          x1={current.x}
          y1={current.y}
          x2={next.x}
          y2={next.y}
          stroke={navigationPathColor}
          strokeWidth={isStepMode ? (isActiveEdge ? 22 : 20) : 20}
          strokeOpacity={isStepMode && !isActiveEdge ? 0.5 : 1}
          strokeLinecap="round"
        />,
      );
    }
    return result;
  }, [
    navigationPath,
    isStepMode,
    activeStepIndex,
    info.graphData.checkpoints,
    floor,
    navigationPathColor,
    activeStepOutlineColor,
  ]);

  return (
    <View style={styles.container} ref={viewContainerRef}>
      <Image source={info.images[floor]} style={styles.image} resizeMode="contain" />
      <Svg style={styles.svg} viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}>
        {nodes}
        {lines}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  svg: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
});
