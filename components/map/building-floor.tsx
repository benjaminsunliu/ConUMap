import { BuildingFloorInfo, IndoorNavigationPath } from "@/types/mapTypes";
import { useMemo, useRef } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

interface BuildingFloorProps {
  info: BuildingFloorInfo;
  floor: number;
  navigationPath?: IndoorNavigationPath;
}

export default function BuildingFloor({
  info,
  floor,
  navigationPath,
}: Readonly<BuildingFloorProps>) {
  const viewContainerRef = useRef(null);

  const imageSize = useMemo(() => {
    const imageInfo = Image.resolveAssetSource(info.images[floor]);
    return { width: imageInfo.width, height: imageInfo.height };
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

    const checkpoints = info.graphData.checkpoints;
    const result = [];
    for (let i = 0; i < navigationPath.length - 1; i++) {
      const current = checkpoints[navigationPath[i]];
      const next = checkpoints[navigationPath[i + 1]];
      result.push(
        <Line
          key={current.id + next.id}
          x1={current.x}
          y1={current.y}
          x2={next.x}
          y2={next.y}
          stroke={"red"}
          strokeWidth={10}
        />,
      );
    }
    return result;
  }, [navigationPath, info.graphData.checkpoints]);

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
