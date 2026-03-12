import { HitboxPoint, useE2EHitboxOverlay } from "@/hooks/useE2EHitboxOverlay";
import { BuildingInfo } from "@/types/mapTypes";
import { JSX, useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native";
import MapView, { Region } from "react-native-maps";

interface E2EOverlayProps {
  inBuildingCodes: Set<string>;
  selectBuildingByCode: (code: string) => BuildingInfo | null;
  focusBuilding: (building: BuildingInfo) => void;
  currentRegion: Region;
  mapViewRef: React.RefObject<MapView | null>;
}

export function E2EOverlay({
  inBuildingCodes,
  selectBuildingByCode,
  focusBuilding,
  currentRegion,
  mapViewRef,
}: Readonly<E2EOverlayProps>): JSX.Element {
    
    
    const [projectedPoints, setProjectedPoints] = useState<HitboxPoint[]>([]);
    useE2EHitboxOverlay({
        currentRegion,
        mapViewRef,
        setProjectedPoints,
    });
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
      {projectedPoints.map(({ building, x, y }) => (
        <Pressable
          key={`e2e-${building.buildingCode}`}
          testID={`e2e-marker-${building.buildingCode}`}
          style={{
            position: "absolute",

            top: y - 20,

            left: x - 20,

            width: 40,

            height: 40,

            opacity: 0.01,

            zIndex: 9999,
          }}
          onPress={() => {
            selectBuildingByCode(building.buildingCode);

            focusBuilding(building);
          }}
        />
      ))}

      {/* Highlighted buildings */}

      {Array.from(inBuildingCodes).map((code) => (
        <View
          key={`highlight-label-${code}`}
          testID={`highlight-label-${code}`}
          style={{
            position: "absolute",

            top: 0,

            left: 0,

            width: 1,

            height: 1,

            opacity: 0.01,
          }}
        />
      ))}
    </View>
  );
}
