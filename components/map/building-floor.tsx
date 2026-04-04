import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  BuildingFloorInfo,
  FloorCheckpoint,
  IndoorNavigationPath,
} from "@/types/mapTypes";
import { useMemo, useRef, type ReactElement } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Image as SvgImage, Line, Rect } from "react-native-svg";

interface BuildingFloorProps {
  info: BuildingFloorInfo;
  floor: number;
  poiFilters: {
    bathrooms: boolean;
    elevators: boolean;
    waterFountains: boolean;
    stairs: boolean;
    escalators: boolean;
  };
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
    return Image.resolveAssetSource(require("@/assets/svg/bathroom.png")).uri;
  }, []);
  const waterFountainIconUri = useMemo(() => {
    return Image.resolveAssetSource(require("@/assets/svg/water_fountain.png")).uri;
  }, []);
  const elevatorIconUri = useMemo(() => {
    return Image.resolveAssetSource(require("@/assets/svg/elevator.png")).uri;
  }, []);
  const stairwayIconUri = useMemo(() => {
    return Image.resolveAssetSource(require("@/assets/svg/stairway.png")).uri;
  }, []);
  const escalatorIconUri = useMemo(() => {
    return Image.resolveAssetSource(require("@/assets/svg/escalator.png")).uri;
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
        const shouldRenderBathroomIcon = isBathroomPoiCheckpoint(floorCheckpoint);
        const shouldRenderWaterFountainIcon = isWaterFountainPoiCheckpoint(floorCheckpoint);
        const shouldRenderElevatorIcon = isElevatorDoorCheckpoint(floorCheckpoint);
        const shouldRenderStairIcon = isStairLandingCheckpoint(floorCheckpoint);
        const shouldRenderEscalatorIcon = isEscalatorCheckpoint(floorCheckpoint);
        const shouldHighlightBathroom = poiFilters.bathrooms && shouldRenderBathroomIcon;
        const shouldHighlightElevator = poiFilters.elevators && shouldRenderElevatorIcon;
        const shouldHighlightStair = poiFilters.stairs && shouldRenderStairIcon;
        const shouldHighlightEscalator = poiFilters.escalators && shouldRenderEscalatorIcon;
        const shouldHighlightWaterFountain =
          poiFilters.waterFountains && shouldRenderWaterFountainIcon;

        return (
          <G key={`node-${floorCheckpoint.id}`}>
            <Circle
              fill="blue"
              stroke="green"
              strokeWidth="5"
              cx={floorCheckpoint.x}
              cy={floorCheckpoint.y}
              r="10"
            />
            {shouldRenderBathroomIcon ? (
              <>
                {shouldHighlightBathroom ? (
                  <Rect
                    x={floorCheckpoint.x - 42}
                    y={floorCheckpoint.y - 42}
                    width={84}
                    height={84}
                    rx="10"
                    fill={bathroomHighlightColor}
                    fillOpacity="0.35"
                    stroke={bathroomHighlightColor}
                    strokeWidth="3"
                    strokeOpacity="0.95"
                    testID={`bathroom-highlight-${floorCheckpoint.id}`}
                  />
                ) : null}
                <SvgImage
                  x={floorCheckpoint.x - 36}
                  y={floorCheckpoint.y - 36}
                  width={72}
                  height={72}
                  href={bathroomIconUri}
                  testID={`bathroom-icon-${floorCheckpoint.id}`}
                />
              </>
            ) : null}
            {shouldRenderWaterFountainIcon ? (
              <>
                {shouldHighlightWaterFountain ? (
                  <Rect
                    x={floorCheckpoint.x - 24}
                    y={floorCheckpoint.y - 24}
                    width={48}
                    height={48}
                    rx="10"
                    fill={waterFountainHighlightColor}
                    fillOpacity="0.35"
                    stroke={waterFountainHighlightColor}
                    strokeWidth="3"
                    strokeOpacity="0.95"
                    testID={`water-fountain-highlight-${floorCheckpoint.id}`}
                  />
                ) : null}
                <SvgImage
                  x={floorCheckpoint.x - 24}
                  y={floorCheckpoint.y - 24}
                  width={48}
                  height={48}
                  href={waterFountainIconUri}
                  testID={`water-fountain-icon-${floorCheckpoint.id}`}
                />
              </>
            ) : null}
            {shouldRenderElevatorIcon ? (
              <>
                {shouldHighlightElevator ? (
                  <Rect
                    x={floorCheckpoint.x - 48}
                    y={floorCheckpoint.y - 78}
                    width={96}
                    height={96}
                    rx="12"
                    fill={elevatorHighlightColor}
                    fillOpacity="0.35"
                    stroke={elevatorHighlightColor}
                    strokeWidth="3"
                    strokeOpacity="0.95"
                    testID={`elevator-highlight-${floorCheckpoint.id}`}
                  />
                ) : null}
                <SvgImage
                  x={floorCheckpoint.x - 48}
                  y={floorCheckpoint.y - 78}
                  width={96}
                  height={96}
                  href={elevatorIconUri}
                  testID={`elevator-icon-${floorCheckpoint.id}`}
                />
              </>
            ) : null}
            {shouldRenderStairIcon ? (
              <>
                {shouldHighlightStair ? (
                  <Rect
                    x={floorCheckpoint.x - 48}
                    y={floorCheckpoint.y - 78}
                    width={96}
                    height={96}
                    rx="12"
                    fill={stairsHighlightColor}
                    fillOpacity="0.35"
                    stroke={stairsHighlightColor}
                    strokeWidth="3"
                    strokeOpacity="0.95"
                    testID={`stair-highlight-${floorCheckpoint.id}`}
                  />
                ) : null}
                <SvgImage
                  x={floorCheckpoint.x - 40}
                  y={floorCheckpoint.y - 73}
                  width={86}
                  height={86}
                  href={stairwayIconUri}
                  testID={`stair-icon-${floorCheckpoint.id}`}
                />
              </>
            ) : null}
            {shouldRenderEscalatorIcon ? (
              <>
                {shouldHighlightEscalator ? (
                  <Rect
                    x={floorCheckpoint.x - 48}
                    y={floorCheckpoint.y - 78}
                    width={96}
                    height={96}
                    rx="12"
                    fill={escalatorHighlightColor}
                    fillOpacity="0.35"
                    stroke={escalatorHighlightColor}
                    strokeWidth="3"
                    strokeOpacity="0.95"
                    testID={`escalator-highlight-${floorCheckpoint.id}`}
                  />
                ) : null}
                <SvgImage
                  x={floorCheckpoint.x - 48}
                  y={floorCheckpoint.y - 78}
                  width={96}
                  height={96}
                  href={escalatorIconUri}
                  testID={`escalator-icon-${floorCheckpoint.id}`}
                />
              </>
            ) : null}
          </G>
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

function isBathroomPoiCheckpoint(checkpoint: FloorCheckpoint) {
  if (checkpoint.type !== "point_of_interest") {
    return false;
  }

  return checkpoint.metadata?.POI?.trim().toLowerCase() === "bathroom";
}

function isWaterFountainPoiCheckpoint(checkpoint: FloorCheckpoint) {
  if (checkpoint.type !== "point_of_interest") {
    return false;
  }

  return checkpoint.metadata?.POI?.trim().toLowerCase() === "water fountain";
}

function isElevatorDoorCheckpoint(checkpoint: FloorCheckpoint) {
  return checkpoint.type === "elevator_door";
}

function isStairLandingCheckpoint(checkpoint: FloorCheckpoint) {
  return checkpoint.type === "stair_landing";
}

function isEscalatorCheckpoint(checkpoint: FloorCheckpoint) {
  return checkpoint.type === "escalator";
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
