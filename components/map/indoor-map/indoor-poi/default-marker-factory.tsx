import { FloorCheckpoint, PoiFilters } from "@/types/mapTypes";
import DefaultPoiMarker from "./default-poi-marker";
import { Image } from "react-native";
import { Colors } from "@/constants/theme";
import { Circle } from "react-native-svg";

type CreatorFunc = (
  checkpoint: FloorCheckpoint,
  filters: PoiFilters,
  colorScheme: (typeof Colors)["light"],
) => React.ReactElement;

interface MarkerFactory {
  createMarker: CreatorFunc;
}

class DefaultMarkerFactory implements MarkerFactory {
  private readonly creators: Record<string, CreatorFunc> = {};
  private readonly icons: Record<string, string> = {};

  // Call the associated POI creator or return a generic circle
  public createMarker: CreatorFunc = (checkpoint, filters, theme) => {
    return (
      this.creators[
        checkpoint?.metadata?.POI?.trim()?.toLowerCase() ?? checkpoint.type
      ]?.(checkpoint, filters, theme) ?? (
        <Circle
          fill="blue"
          stroke="green"
          strokeWidth="5"
          cx={checkpoint.x}
          cy={checkpoint.y}
          r="10"
          key={checkpoint.id}
        />
      )
    );
  };

  private readonly bathroomCreator: CreatorFunc = (checkpoint, filters, theme) => (
    <DefaultPoiMarker
      shouldHighlight={filters.bathrooms}
      iconUri={this.icons.bathroom}
      iconX={checkpoint.x - 36}
      iconY={checkpoint.y - 36}
      iconWidth={72}
      iconHeight={72}
      iconTestID={`bathroom-icon-${checkpoint.id}`}
      highlightColor={theme.map.bathroomHighlightColor}
      highlightX={checkpoint.x - 46}
      highlightY={checkpoint.y - 46}
      highlightWidth={92}
      highlightHeight={92}
      highlightRx={10}
      highlightTestID={`bathroom-highlight-${checkpoint.id}`}
      key={checkpoint.id}
    />
  );

  private readonly waterFountainCreator: CreatorFunc = (checkpoint, filters, theme) => (
    <DefaultPoiMarker
      shouldHighlight={filters.waterFountains}
      iconUri={this.icons.waterFountain}
      iconX={checkpoint.x - 24}
      iconY={checkpoint.y - 24}
      iconWidth={48}
      iconHeight={48}
      iconTestID={`water-fountain-icon-${checkpoint.id}`}
      highlightColor={theme.map.waterFountainHighlightColor}
      highlightX={checkpoint.x - 38}
      highlightY={checkpoint.y - 38}
      highlightWidth={78}
      highlightHeight={78}
      highlightRx={10}
      highlightTestID={`water-fountain-highlight-${checkpoint.id}`}
      key={checkpoint.id}
    />
  );

  private readonly elevatorCreator: CreatorFunc = (checkpoint, filters, theme) => (
    <DefaultPoiMarker
      shouldHighlight={filters.elevators}
      iconUri={this.icons.elevator}
      iconX={checkpoint.x - 46}
      iconY={checkpoint.y - 78}
      iconWidth={96}
      iconHeight={96}
      iconTestID={`elevator-icon-${checkpoint.id}`}
      highlightColor={theme.map.elevatorHighlightColor}
      highlightX={checkpoint.x - 48}
      highlightY={checkpoint.y - 78}
      highlightWidth={96}
      highlightHeight={96}
      highlightRx={12}
      highlightTestID={`elevator-highlight-${checkpoint.id}`}
      key={checkpoint.id}
    />
  );

  private readonly stairCreator: CreatorFunc = (checkpoint, filters, theme) => (
    <DefaultPoiMarker
      shouldHighlight={filters.stairs}
      iconUri={this.icons.stair}
      iconX={checkpoint.x - 20}
      iconY={checkpoint.y - 52}
      iconWidth={65}
      iconHeight={65}
      iconTestID={`stair-icon-${checkpoint.id}`}
      highlightColor={theme.map.stairsHighlightColor}
      highlightX={checkpoint.x - 36}
      highlightY={checkpoint.y - 68}
      highlightWidth={96}
      highlightHeight={96}
      highlightRx={12}
      highlightTestID={`stair-highlight-${checkpoint.id}`}
      key={checkpoint.id}
    />
  );

  private readonly escalatorCreator: CreatorFunc = (checkpoint, filters, theme) => (
    <DefaultPoiMarker
      shouldHighlight={filters.escalators}
      iconUri={this.icons.escalator}
      iconX={checkpoint.x - 48}
      iconY={checkpoint.y - 58}
      iconWidth={75}
      iconHeight={75}
      iconTestID={`escalator-icon-${checkpoint.id}`}
      highlightColor={theme.map.escalatorHighlightColor}
      highlightX={checkpoint.x - 60}
      highlightY={checkpoint.y - 70}
      highlightWidth={100}
      highlightHeight={100}
      highlightRx={12}
      highlightTestID={`escalator-highlight-${checkpoint.id}`}
      key={checkpoint.id}
    />
  );

  constructor() {
    this.icons = {
      bathroom: Image.resolveAssetSource(require("@/assets/icons/bathroom.png")).uri,
      waterFountain: Image.resolveAssetSource(
        require("@/assets/icons/water_fountain.png"),
      ).uri,
      elevator: Image.resolveAssetSource(require("@/assets/icons/elevator.png")).uri,
      stair: Image.resolveAssetSource(require("@/assets/icons/stairway.png")).uri,
      escalator: Image.resolveAssetSource(require("@/assets/icons/escalator.png")).uri,
    };

    // Matching keys to the values of the data instead of another translation layer.
    // May want to change later
    this.creators = {
      bathroom: this.bathroomCreator,
      "water fountain": this.waterFountainCreator,
      elevator_door: this.elevatorCreator,
      stair_landing: this.stairCreator,
      escalator: this.escalatorCreator,
    };
  }
}

export default new DefaultMarkerFactory();
