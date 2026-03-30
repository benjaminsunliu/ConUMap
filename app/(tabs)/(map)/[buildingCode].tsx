import BuildingFloor from "@/components/map/building-floor";
import FloorSelector from "@/components/map/floor-selection-menu";
import MapSettings from "@/components/map/indoor-map-settings";
import IndoorNavigationControls from "@/components/map/indoor-navigation-controls";
import { NavigationLoader } from "@/globals/IndoorNavigationLoader";
import {
  BuildingFloorInfo,
  FloorCheckpointsGraph,
  IndoorNavigationPath,
} from "@/types/mapTypes";
import { findIndoorPath } from "@/utils/indoorNavigation";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

type Step = {
  floor?: number;
  coordinates?: { x: number; y: number };
};

export default function IndoorMap() {
  const { buildingCode } = useLocalSearchParams<{
    buildingCode: string;
  }>();

  const {
    data: floorInfo,
    error,
    isFetching,
  } = useQuery({
    queryKey: [buildingCode, "floorInfo"],
    queryFn: async (): Promise<BuildingFloorInfo> => {
      const info = await NavigationLoader.loadBuildingData(buildingCode);
      if (!info) {
        throw new Error("Couldn't load the floor info");
      }
      return info;
    },
    retry: false,
    gcTime: 0, // We set the gc time to 0 since we handle our own caching and garbage collection
  });
  const [floor, setFloor] = useState<number | undefined>(undefined);
  const [navigationPath, setNavigationPath] = useState<IndoorNavigationPath | undefined>(
    undefined,
  );
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [poiFilters, setPoiFilters] = useState({
    bathrooms: false,
    elevators: false,
    washrooms: false,
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  type StepType = "next" | "prev";
  const handleStep = (step: StepType) => {
    let newStep;
    if (step === "next") {
      newStep = Math.min(currentStepIndex + 1, floorSteps.length - 1);
    } else {
      newStep = Math.max(currentStepIndex - 1, 0);
    }
    setFloor(floorSteps[newStep]);
    setCurrentStepIndex(newStep);
  };

  const availableFloors: number[] = useMemo(() => {
    return floorInfo?.images
      ? Object.keys(floorInfo.images)
          .map(Number)
          .sort((a, b) => a - b)
      : [];
  }, [floorInfo]);
  type AvailableFloor = (typeof availableFloors)[number];
  const floorSteps: AvailableFloor[] = [1, 2];
  const canGoNext = currentStepIndex < floorSteps.length - 1;
  const canGoPrevious = currentStepIndex > 0;

  const firstFloor = useMemo(() => {
    return availableFloors[0];
  }, [availableFloors]);

  const defaultFloor = floor || firstFloor;

  return (
    <View style={styles.container}>
      {isFetching ? <Text>Loading...</Text> : null}
      {error ? <Text>Something went wrong</Text> : null}
      {floorInfo && defaultFloor ? (
        <>
          <FloorSelector
            buildingName={buildingCode} //TODO temp
            availableFloors={availableFloors}
            currentFloor={defaultFloor}
            onSelectFloor={(floor: number) => {
              setFloor(floor);
            }}
          />

          <MapSettings
            wheelchairOnly={wheelchairOnly} //TODO temp
            setWheelchairOnly={setWheelchairOnly} //TODO temp
            poiFilters={poiFilters} //TODO temp
            setPoiFilters={setPoiFilters} //TODO temp
          />
          <IndoorNavigationControls
            onNext={() => handleStep("next")}
            onPrevious={() => handleStep("prev")}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
          />
          <BuildingFloor
            info={floorInfo}
            navigationPath={navigationPath}
            floor={defaultFloor}
          />
          <Button
            title="Create Random Path"
            onPress={() => {
              const graph = floorInfo.graphData;
              const source = getRandomCheckpointOnFloor(graph, defaultFloor).id;
              const destination = getRandomCheckpointOnFloor(graph, defaultFloor).id;
              const path = findIndoorPath(floorInfo.graphData, source, destination);
              setNavigationPath(path || undefined);
            }}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function getRandomCheckpointOnFloor(graph: FloorCheckpointsGraph, floor: number) {
  const possibleCheckpoints = Object.values(graph.checkpoints).filter(
    (checkpoint) => checkpoint.floor === floor,
  );
  const r = randomInt(possibleCheckpoints.length);
  return possibleCheckpoints[r];
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}
