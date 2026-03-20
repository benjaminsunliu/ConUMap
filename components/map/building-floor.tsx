import { BuildingFloorInfo } from "@/types/mapTypes";
import { Image, StyleSheet, View } from "react-native";
import { use, useMemo, useRef } from "react";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { useQuery } from "@tanstack/react-query";
import Svg, { Circle } from "react-native-svg";

interface BuildingFloorProps {
  info: BuildingFloorInfo;
  floorNumber: number;
}

export default function BuildingFloor({
  info: { imageURI, graphData: graph },
}: Readonly<BuildingFloorProps>) {
  const viewContainerRef = useRef(null);

  const imageSize = useMemo(() => {
    const info = Image.resolveAssetSource(imageURI);
    return { width: info.width, height: info.height };
  }, [imageURI]);

  const nodes = useMemo(() => {
    if (!viewContainerRef) {
      return null;
    }
    return Object.values(graph.checkpoints)
      .filter((floorCheckpoint) => {
        return floorCheckpoint.floor === 9;
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
      <Image source={imageURI} style={styles.image} resizeMode="contain" />
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
