import { Image as SvgImage, Rect } from "react-native-svg";

interface DefaultPoiMarkerProps {
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
}

export default function DefaultPoiMarker({
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
}: Readonly<DefaultPoiMarkerProps>) {
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
