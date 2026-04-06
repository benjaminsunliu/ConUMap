import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import { ClassSchedule } from "@/hooks/use-calendar";
import { buildRoomLookup, resolveCanonicalRoom } from "@/utils/roomSearch";

type ClassLocationFields = Pick<ClassSchedule, "CU_BLDG" | "ROOM">;

export async function resolveSupportedClassRoom({ CU_BLDG, ROOM }: ClassLocationFields) {
  const buildingCode = CU_BLDG.trim().toUpperCase();
  const roomQuery = ROOM.trim();

  if (!buildingCode || !roomQuery) {
    return null;
  }

  if (!NavigationLoader.buildingHasNavigationData(buildingCode)) {
    return null;
  }

  try {
    const floorInfo = await NavigationLoader.loadBuildingData(buildingCode);
    if (!floorInfo) {
      return null;
    }

    const roomLookup = buildRoomLookup(floorInfo.rooms ?? [], buildingCode);
    return resolveCanonicalRoom(roomQuery, buildingCode, roomLookup) ?? null;
  } catch {
    return null;
  }
}

export async function buildClassMapNavigationParams(classInfo: ClassLocationFields) {
  const buildingId = classInfo.CU_BLDG.trim().toUpperCase();
  const params: Record<string, string> = {
    buildingId,
  };

  const destinationRoom = await resolveSupportedClassRoom(classInfo);
  if (destinationRoom) {
    params.destinationRoom = destinationRoom;
  }

  return params;
}

export async function buildClassDirectionsNavigationParams(classInfo: ClassLocationFields) {
  const params = await buildClassMapNavigationParams(classInfo);
  return {
    ...params,
    autoNavigate: "true",
  };
}
