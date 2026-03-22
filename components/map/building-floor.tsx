import { BuildingFloorInfo } from "@/types/mapTypes";
import { useMemo, useRef } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface BuildingFloorProps {
  info: BuildingFloorInfo;
  floor?: number;
}

export default function BuildingFloor({ info, floor }: Readonly<BuildingFloorProps>) {
  const { images, graphData: graph } = info;
  const viewContainerRef = useRef(null);
  const floorNumber = floor || getFirstFloor(info);

  const imageSize = useMemo(() => {
    const info = Image.resolveAssetSource(images[floorNumber]);
    return { width: info.width, height: info.height };
  }, [images]);

  const nodes = useMemo(() => {
    if (!viewContainerRef) {
      return null;
    }
    return Object.values(graph.checkpoints)
      .filter((floorCheckpoint) => {
        return floorCheckpoint.floor === floorNumber;
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
  }, [viewContainerRef]);

  return (
    <View style={styles.container} ref={viewContainerRef}>
      <Image source={images[floorNumber]} style={styles.image} resizeMode="contain" />
      <Svg style={styles.svg} viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}>
        {nodes}
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

function getFirstFloor(info: BuildingFloorInfo) {
  const firstFloor = Object.keys(info.images).sort((a, b) => Number(a) - Number(b))[0];
  return Number(firstFloor);
}
