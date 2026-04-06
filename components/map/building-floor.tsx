import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  BuildingFloorInfo,
  FloorCheckpoint,
  IndoorNavigationPath,
} from "@/types/mapTypes";
import { useMemo, useRef, type ReactElement } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Image as SvgImage, Line, Rect } from "react-native-svg";

type PoiFilters = {
  bathrooms: boolean;
  elevators: boolean;
  waterFountains: boolean;
  stairs: boolean;
  escalators: boolean;
};

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
    const imageInfo = resolveAssetMetadata(info.images[floor]);
    return imageInfo.width && imageInfo.height
      ? { width: imageInfo.width, height: imageInfo.height }
      : { width: 0, height: 0 };
  }, [info.images, floor]);
  const bathroomIconUri = useMemo(() => {
    return resolveAssetMetadata(require("@/assets/icons/bathroom.png")).uri;
  }, []);
  const waterFountainIconUri = useMemo(() => {
    return resolveAssetMetadata(require("@/assets/icons/water_fountain.png")).uri;
  }, []);
  const elevatorIconUri = useMemo(() => {
    return resolveAssetMetadata(require("@/assets/icons/elevator.png")).uri;
  }, []);
  const stairwayIconUri = useMemo(() => {
    return resolveAssetMetadata(require("@/assets/icons/stairway.png")).uri;
  }, []);
  const escalatorIconUri = useMemo(() => {
    return resolveAssetMetadata(require("@/assets/icons/escalator.png")).uri;
  }, []);

  const nodes = useMemo(() => {
    if (!viewContainerRef) {
      return null;
    }
    return Object.values(info.graphData.checkpoints)
      .filter((floorCheckpoint) => {
        return floorCheckpoint.floor === floor;
      })
      .map((floorCheckpoint) =>
        renderCheckpointNode({
          floorCheckpoint,
          poiFilters,
          icons: {
            bathroom: bathroomIconUri,
            waterFountain: waterFountainIconUri,
            elevator: elevatorIconUri,
            stair: stairwayIconUri,
            escalator: escalatorIconUri,
          },
          highlightColors: {
            bathroom: bathroomHighlightColor,
            waterFountain: waterFountainHighlightColor,
            elevator: elevatorHighlightColor,
            stair: stairsHighlightColor,
            escalator: escalatorHighlightColor,
          },
        }),
      );
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
      <View style={styles.mapCanvas}>
        <Image source={info.images[floor]} style={styles.image} resizeMode="contain" />
        <Svg style={styles.svg} viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}>
          {nodes}
          {lines}
        </Svg>
      </View>
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
      testID={`active-outline-${current.id}-${next.id}-${floor}`}
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

type RenderIconLayerOptions = {
  shouldRender: boolean;
  shouldHighlight: boolean;
  iconUri: string;
  iconX: number;
  iconY: number;
  iconWidth: number;
  iconHeight: number;
  iconTestID: string;
  highlightColor: string;
  highlightX: number;
  highlightY: number;
  highlightWidth: number;
  highlightHeight: number;
  highlightRx: number;
  highlightTestID: string;
};

function renderIconLayer({
  shouldRender,
  shouldHighlight,
  iconUri,
  iconX,
  iconY,
  iconWidth,
  iconHeight,
  iconTestID,
  highlightColor,
  highlightX,
  highlightY,
  highlightWidth,
  highlightHeight,
  highlightRx,
  highlightTestID,
}: RenderIconLayerOptions) {
  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {shouldHighlight ? (
        <Rect
          x={highlightX}
          y={highlightY}
          width={highlightWidth}
          height={highlightHeight}
          rx={String(highlightRx)}
          fill={highlightColor}
          fillOpacity="0.70"
          stroke={highlightColor}
          strokeWidth="3"
          strokeOpacity="0.95"
          testID={highlightTestID}
        />
      ) : null}
      <SvgImage
        x={iconX}
        y={iconY}
        width={iconWidth}
        height={iconHeight}
        href={iconUri}
        testID={iconTestID}
      />
    </>
  );
}

type RenderCheckpointNodeOptions = {
  floorCheckpoint: FloorCheckpoint;
  poiFilters: PoiFilters;
  icons: {
    bathroom: string;
    waterFountain: string;
    elevator: string;
    stair: string;
    escalator: string;
  };
  highlightColors: {
    bathroom: string;
    waterFountain: string;
    elevator: string;
    stair: string;
    escalator: string;
  };
};

function renderCheckpointNode({
  floorCheckpoint,
  poiFilters,
  icons,
  highlightColors,
}: RenderCheckpointNodeOptions) {
  const shouldRenderBathroomIcon = isBathroomPoiCheckpoint(floorCheckpoint);
  const shouldRenderWaterFountainIcon = isWaterFountainPoiCheckpoint(floorCheckpoint);
  const shouldRenderElevatorIcon = isElevatorDoorCheckpoint(floorCheckpoint);
  const shouldRenderStairIcon = isStairLandingCheckpoint(floorCheckpoint);
  const shouldRenderEscalatorIcon = isEscalatorCheckpoint(floorCheckpoint);

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

      {renderIconLayer({
        shouldRender: shouldRenderBathroomIcon,
        shouldHighlight: poiFilters.bathrooms && shouldRenderBathroomIcon,
        iconUri: icons.bathroom,
        iconX: floorCheckpoint.x - 36,
        iconY: floorCheckpoint.y - 36,
        iconWidth: 72,
        iconHeight: 72,
        iconTestID: `bathroom-icon-${floorCheckpoint.id}`,
        highlightColor: highlightColors.bathroom,
        highlightX: floorCheckpoint.x - 46,
        highlightY: floorCheckpoint.y - 46,
        highlightWidth: 92,
        highlightHeight: 92,
        highlightRx: 10,
        highlightTestID: `bathroom-highlight-${floorCheckpoint.id}`,
      })}

      {renderIconLayer({
        shouldRender: shouldRenderWaterFountainIcon,
        shouldHighlight: poiFilters.waterFountains && shouldRenderWaterFountainIcon,
        iconUri: icons.waterFountain,
        iconX: floorCheckpoint.x - 24,
        iconY: floorCheckpoint.y - 24,
        iconWidth: 48,
        iconHeight: 48,
        iconTestID: `water-fountain-icon-${floorCheckpoint.id}`,
        highlightColor: highlightColors.waterFountain,
        highlightX: floorCheckpoint.x - 38,
        highlightY: floorCheckpoint.y - 38,
        highlightWidth: 78,
        highlightHeight: 78,
        highlightRx: 10,
        highlightTestID: `water-fountain-highlight-${floorCheckpoint.id}`,
      })}

      {renderIconLayer({
        shouldRender: shouldRenderElevatorIcon,
        shouldHighlight: poiFilters.elevators && shouldRenderElevatorIcon,
        iconUri: icons.elevator,
        iconX: floorCheckpoint.x - 46,
        iconY: floorCheckpoint.y - 78,
        iconWidth: 96,
        iconHeight: 96,
        iconTestID: `elevator-icon-${floorCheckpoint.id}`,
        highlightColor: highlightColors.elevator,
        highlightX: floorCheckpoint.x - 48,
        highlightY: floorCheckpoint.y - 78,
        highlightWidth: 96,
        highlightHeight: 96,
        highlightRx: 12,
        highlightTestID: `elevator-highlight-${floorCheckpoint.id}`,
      })}

      {renderIconLayer({
        shouldRender: shouldRenderStairIcon,
        shouldHighlight: poiFilters.stairs && shouldRenderStairIcon,
        iconUri: icons.stair,
        iconX: floorCheckpoint.x - 20,
        iconY: floorCheckpoint.y - 52,
        iconWidth: 65,
        iconHeight: 65,
        iconTestID: `stair-icon-${floorCheckpoint.id}`,
        highlightColor: highlightColors.stair,
        highlightX: floorCheckpoint.x - 36,
        highlightY: floorCheckpoint.y - 68,
        highlightWidth: 96,
        highlightHeight: 96,
        highlightRx: 12,
        highlightTestID: `stair-highlight-${floorCheckpoint.id}`,
      })}

      {renderIconLayer({
        shouldRender: shouldRenderEscalatorIcon,
        shouldHighlight: poiFilters.escalators && shouldRenderEscalatorIcon,
        iconUri: icons.escalator,
        iconX: floorCheckpoint.x - 48,
        iconY: floorCheckpoint.y - 58,
        iconWidth: 75,
        iconHeight: 75,
        iconTestID: `escalator-icon-${floorCheckpoint.id}`,
        highlightColor: highlightColors.escalator,
        highlightX: floorCheckpoint.x - 60,
        highlightY: floorCheckpoint.y - 70,
        highlightWidth: 100,
        highlightHeight: 100,
        highlightRx: 12,
        highlightTestID: `escalator-highlight-${floorCheckpoint.id}`,
      })}
    </G>
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

function resolveAssetMetadata(source: unknown) {
  const resolver = (Image as unknown as { resolveAssetSource?: (asset: unknown) => any })
    .resolveAssetSource;
  if (typeof resolver === "function") {
    return resolver(source) ?? { uri: "", width: 0, height: 0 };
  }

  if (source && typeof source === "object") {
    const candidate = source as {
      uri?: string;
      width?: number;
      height?: number;
      default?: { uri?: string; width?: number; height?: number };
    };
    if (candidate.uri || candidate.width || candidate.height) {
      return {
        uri: candidate.uri ?? "",
        width: candidate.width ?? 0,
        height: candidate.height ?? 0,
      };
    }
    if (candidate.default) {
      return {
        uri: candidate.default.uri ?? "",
        width: candidate.default.width ?? 0,
        height: candidate.default.height ?? 0,
      };
    }
  }

  return { uri: "", width: 0, height: 0 };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    paddingTop: Platform.OS === "web" ? 126 : 112,
    paddingBottom: Platform.OS === "web" ? 92 : 80,
    paddingHorizontal: 8,
  },
  mapCanvas: {
    flex: 1,
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
