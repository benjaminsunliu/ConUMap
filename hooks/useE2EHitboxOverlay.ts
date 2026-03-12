import MapView, { Region } from "react-native-maps";
import { BuildingInfo } from "@/types/mapTypes";
import { useEffect } from "react";
import { CAMPUS_BUILDINGS } from "@/constants/map";

export interface HitboxPoint {
  building: BuildingInfo;
  x: number;
  y: number;
}

interface E2EHitboxOverlayProps {
  currentRegion: Region | null;
  mapReady: boolean;
  mapViewRef: React.RefObject<MapView | null>;
 setProjectedPoints: (pts: HitboxPoint[]) => void;
}

export function useE2EHitboxOverlay({
  currentRegion,
  mapReady,
  mapViewRef,
  setProjectedPoints,
}: E2EHitboxOverlayProps) {
  useEffect(() => {
    if ( !currentRegion) return;

    let isCancelled = false;

    async function updateHitboxPositions() {
      if (!currentRegion) return;
      if (!mapReady || !mapViewRef.current || isCancelled) {
        setProjectedPoints([]);
        return;
      }

      try {
        const { latitude, longitude, latitudeDelta, longitudeDelta } = currentRegion;

        const minLat = latitude - latitudeDelta / 2;
        const maxLat = latitude + latitudeDelta / 2;
        const minLng = longitude - longitudeDelta / 2;
        const maxLng = longitude + longitudeDelta / 2;

        const visibleBuildings = CAMPUS_BUILDINGS.filter((building) => {
          const coord = building.location;
          return (
            coord.latitude >= minLat &&
            coord.latitude <= maxLat &&
            coord.longitude >= minLng &&
            coord.longitude <= maxLng
          );
        });

        if (!visibleBuildings.length || !mapViewRef.current || isCancelled) {
          setProjectedPoints([]);
          return;
        }

        const projections = await Promise.all(
          visibleBuildings.map(async (building) => {
            if (!mapViewRef.current || isCancelled) return null;
            const point = await mapViewRef.current.pointForCoordinate(building.location);
            return { building, x: point.x, y: point.y };
          })
        );

        if (isCancelled) return;

        const next: HitboxPoint[] = projections.filter(Boolean) as HitboxPoint[];
        setProjectedPoints(next);

      } catch (error) {
        console.warn("Failed to update hitbox positions", error);
        setProjectedPoints([]);
      }
    }

    updateHitboxPositions();
    return () => {
      isCancelled = true;
    };
  }, [currentRegion, mapReady, mapViewRef]);
}
