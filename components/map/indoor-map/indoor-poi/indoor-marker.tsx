import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  BuildingFloorInfo,
  FloorCheckpoint,
  IndoorNavigationPath,
  PoiFilters
} from "@/types/mapTypes";
import { useMemo, useRef, type ReactElement } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Image as SvgImage, Line, Rect } from "react-native-svg";


interface IndoorMarkerProps {
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
}

export default function IndoorMarker({
  floorCheckpoint,
  poiFilters,
  icons,
  highlightColors,
}: IndoorMarkerProps) {
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