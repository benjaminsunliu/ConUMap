import * as SecureStore from "expo-secure-store";
import { CAMPUS_BUILDINGS } from "@/constants/map";
import { BuildingInfo } from "@/types/mapTypes";
import fs from "fs";

type BuildingCode = BuildingInfo["buildingCode"];

// REVIEW: please tell me a better name for this
class BuildingDatabase {
  public async clearAllData() {
    const promises = CAMPUS_BUILDINGS.map((building) => {
      return SecureStore.deleteItemAsync(
        BuildingDatabase.getBuildingKey(building.buildingCode),
      );
    });
    await Promise.all(promises);
  }

  public async searchForRoom(searchQuery: string) {
    // TODO:
  }

  public async getBuildingData(buildingCode: BuildingCode) {}

  private static loadData(buildingCode: BuildingCode) {
    fs.readFileSync(`../data/${buildingCode}.json`);
  }

  private static getBuildingKey(buildingCode: BuildingCode) {
    return `${buildingCode}-rooms-graph`;
  }
}

export const BuildingRoomDB = new BuildingDatabase();
