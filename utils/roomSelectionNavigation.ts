import { FieldType, SearchBuilding } from "@/types/buildingTypes";
import { BuildingInfo } from "@/types/mapTypes";
import { resolveSearchSelectionBuildingCode } from "@/utils/hybridNavigation";

export type SearchSelections = Record<FieldType, SearchBuilding | null>;

export type IndoorRoomRouteParams = {
  buildingCode: string;
  indoorStartRoom: string;
  indoorEndRoom: string;
};

export function resolveIndoorRoomName(selection: SearchBuilding | null | undefined) {
  if (!selection) {
    return null;
  }

  const roomName = (selection.roomName ?? selection.buildingName ?? "").trim();
  if (!roomName) {
    return null;
  }

  const isRoomSelection = Boolean(
    selection.isIndoorRoom || selection.parentBuildingCode || selection.roomName,
  );
  return isRoomSelection ? roomName : null;
}

export function buildIndoorRoomRouteFromSelections(
  selections: SearchSelections,
  buildings: BuildingInfo[],
): IndoorRoomRouteParams | null {
  const startRoom = resolveIndoorRoomName(selections.start);
  const endRoom = resolveIndoorRoomName(selections.end);
  if (!startRoom || !endRoom) {
    return null;
  }

  const startBuildingCode = resolveSearchSelectionBuildingCode(
    selections.start,
    buildings,
  );
  const endBuildingCode = resolveSearchSelectionBuildingCode(selections.end, buildings);
  if (!startBuildingCode || !endBuildingCode || startBuildingCode !== endBuildingCode) {
    return null;
  }

  return {
    buildingCode: startBuildingCode,
    indoorStartRoom: startRoom,
    indoorEndRoom: endRoom,
  };
}
