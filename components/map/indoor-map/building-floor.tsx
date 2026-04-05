import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  BuildingFloorInfo,
  FloorCheckpoint,
  IndoorNavigationPath,
  PoiFilters,
} from "@/types/mapTypes";
import { useMemo, useRef, type ReactElement } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Image as SvgImage, Line, Rect } from "react-native-svg";
import IndoorMarker from "./indoor-poi/indoor-marker";

interface BuildingFloorProps {
  info: BuildingFloorInfo;
  floor: number;
  poiFilters: PoiFilters;
  navigationPath?: IndoorNavigationPath;
  isStepMode?: boolean;
  activeStepIndex?: number;
}

export default function BuildingFloor({
  info,
  floor,
  poiFilters,
  navigationPath,
  isStepMode = false,
  activeStepIndex = 0,
}: Readonly<BuildingFloorProps>) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const navigationPathColor = theme.map.navigationPathColor;
  const activeStepOutlineColor = theme.map.currentSelectedBuildingColor;
  const bathroomHighlightColor = theme.map.bathroomHighlightColor;
  const elevatorHighlightColor = theme.map.elevatorHighlightColor;
  const stairsHighlightColor = theme.map.stairsHighlightColor;
  const escalatorHighlightColor = theme.map.escalatorHighlightColor;
  const waterFountainHighlightColor = theme.map.waterFountainHighlightColor;
  const viewContainerRef = useRef(null);

  const imageSize = useMemo(() => {
    const imageInfo = Image.resolveAssetSource(info.images[floor]);
    return imageInfo?.width && imageInfo?.height
      ? { width: imageInfo.width, height: imageInfo.height }
      : { width: 0, height: 0 };
  }, [info.images, floor]);
  const bathroomIconUri = useMemo(() => {
    return Image.resolveAssetSource(require("@/assets/icons/bathroom.png")).uri;
  }, []);
  const waterFountainIconUri = useMemo(() => {
    return Image.resolveAssetSource(require("@/assets/icons/water_fountain.png")).uri;
  }, []);
  const elevatorIconUri = useMemo(() => {
    return Image.resolveAssetSource(require("@/assets/icons/elevator.png")).uri;
  }, []);
  const stairwayIconUri = useMemo(() => {
    return Image.resolveAssetSource(require("@/assets/icons/stairway.png")).uri;
  }, []);
  const escalatorIconUri = useMemo(() => {
    return Image.resolveAssetSource(require("@/assets/icons/escalator.png")).uri;
  }, []);

  const nodes = useMemo(() => {
    if (!viewContainerRef) {
      return null;
    }
    return Object.values(info.graphData.checkpoints)
      .filter((floorCheckpoint) => {
        return floorCheckpoint.floor === floor;
      })
      .map((floorCheckpoint) => {
        const icons = {
          bathroom: bathroomIconUri,
          waterFountain: waterFountainIconUri,
          elevator: elevatorIconUri,
          stair: stairwayIconUri,
          escalator: escalatorIconUri,
        };

        const highlightColors = {
          bathroom: bathroomHighlightColor,
          waterFountain: waterFountainHighlightColor,
          elevator: elevatorHighlightColor,
          stair: stairsHighlightColor,
          escalator: escalatorHighlightColor,
        };

        return (
          <IndoorMarker
            key={floorCheckpoint.id}
            floorCheckpoint={floorCheckpoint}
            poiFilters={poiFilters}
            icons={icons}
            highlightColors={highlightColors}
          />
        );
      });
  }, [
    viewContainerRef,
    info.graphData.checkpoints,
    floor,
    poiFilters,
    bathroomIconUri,
    waterFountainIconUri,
    elevatorIconUri,
    stairwayIconUri,
    escalatorIconUri,
    bathroomHighlightColor,
    elevatorHighlightColor,
    stairsHighlightColor,
    escalatorHighlightColor,
    waterFountainHighlightColor,
  ]);

  const lines = useMemo(() => {
    if (!navigationPath) {
      return null;
    }
    return buildNavigationLines({
      navigationPath,
      checkpoints: info.graphData.checkpoints,
      floor,
      isStepMode,
      activeStepIndex,
      navigationPathColor,
      activeStepOutlineColor,
    });
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

type BuildNavigationLinesOptions = {
  navigationPath: IndoorNavigationPath;
  checkpoints: BuildingFloorInfo["graphData"]["checkpoints"];
  floor: number;
  isStepMode: boolean;
  activeStepIndex: number;
  navigationPathColor: string;
  activeStepOutlineColor: string;
};

function getActiveEdgeIndex(
  navigationPath: IndoorNavigationPath,
  isStepMode: boolean,
  activeStepIndex: number,
) {
  if (!isStepMode) {
    return -1;
  }

  return Math.min(Math.max(activeStepIndex, 0), Math.max(navigationPath.length - 2, 0));
}

function getPathStrokeWidth(isStepMode: boolean, isActiveEdge: boolean) {
  if (!isStepMode) {
    return 20;
  }

  return isActiveEdge ? 22 : 20;
}

function getPathStrokeOpacity(isStepMode: boolean, isActiveEdge: boolean) {
  return isStepMode && !isActiveEdge ? 0.5 : 1;
}

function renderActiveEdgeOutline({
  current,
  next,
  floor,
  activeStepOutlineColor,
}: {
  current: FloorCheckpoint;
  next: FloorCheckpoint;
  floor: number;
  activeStepOutlineColor: string;
}) {
  return (
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
    />
  );
}

function renderPathEdge({
  current,
  next,
  edgeIndex,
  floor,
  navigationPathColor,
  isStepMode,
  isActiveEdge,
}: {
  current: FloorCheckpoint;
  next: FloorCheckpoint;
  edgeIndex: number;
  floor: number;
  navigationPathColor: string;
  isStepMode: boolean;
  isActiveEdge: boolean;
}) {
  return (
    <Line
      key={`${current.id}-${next.id}-${floor}`}
      testID={`indoor-path-edge-${edgeIndex}`}
      x1={current.x}
      y1={current.y}
      x2={next.x}
      y2={next.y}
      stroke={navigationPathColor}
      strokeWidth={getPathStrokeWidth(isStepMode, isActiveEdge)}
      strokeOpacity={getPathStrokeOpacity(isStepMode, isActiveEdge)}
      strokeLinecap="round"
    />
  );
}

function buildNavigationLines({
  navigationPath,
  checkpoints,
  floor,
  isStepMode,
  activeStepIndex,
  navigationPathColor,
  activeStepOutlineColor,
}: BuildNavigationLinesOptions) {
  const activeEdgeIndex = getActiveEdgeIndex(navigationPath, isStepMode, activeStepIndex);
  const result: ReactElement[] = [];

  for (let edgeIndex = 0; edgeIndex < navigationPath.length - 1; edgeIndex++) {
    const current = checkpoints[navigationPath[edgeIndex]];
    const next = checkpoints[navigationPath[edgeIndex + 1]];
    if (!current || !next || current.floor !== floor || next.floor !== floor) {
      continue;
    }

    const isActiveEdge = isStepMode && edgeIndex === activeEdgeIndex;
    if (isActiveEdge) {
      result.push(
        renderActiveEdgeOutline({
          current,
          next,
          floor,
          activeStepOutlineColor,
        }),
      );
    }

    result.push(
      renderPathEdge({
        current,
        next,
        edgeIndex,
        floor,
        navigationPathColor,
        isStepMode,
        isActiveEdge,
      }),
    );
  }

  return result;
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
