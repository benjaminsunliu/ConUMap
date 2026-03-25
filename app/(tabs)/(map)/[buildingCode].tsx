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
import { useEffect, useMemo, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";


type Step = {
  instruction: string;
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

  const steps: Step[] = [
    { instruction: "Head straight through the entrance", floor: 1 },
    { instruction: "Keep walking forward down the hall", floor: 1 },
    { instruction: "Turn right at the elevators", floor: 1 },
    { instruction: "Go up to the next floor", floor: 2 },
    { instruction: "Continue to the end of the corridor", floor: 2 },
  ];

   const [currentStepIndex, setCurrentStepIndex] = useState(0);

   const goToNextStep = () => {
     setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
   };

   const goToPreviousStep = () => {
     setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
   };

   const currentStep = steps[currentStepIndex];
   const instruction = currentStep.instruction;
   const canGoNext = currentStepIndex < steps.length - 1;
   const canGoPrevious = currentStepIndex > 0;

   useEffect(() => {
       if (currentStep.floor && currentStep.floor !== floor) {
         setFloor(currentStep.floor);
       }
     }, [floor, currentStep.floor, currentStepIndex]);

  const firstFloor = useMemo(() => {
    if (floorInfo) {
      return getFirstFloor(floorInfo);
    }
  }, [floorInfo]);

  const defaultFloor = floor || firstFloor;
  const availableFloors = floorInfo && floorInfo.images ? Object.keys(floorInfo.images).map(Number) : []

  return (
    <View style={styles.container}>
      {isFetching ? <Text>Loading...</Text> : null}
      {error ? <Text>Something went wrong</Text> : null}
      {floorInfo && defaultFloor ? (
        <>
          <FloorSelector
            buildingName="Hall" //TODO temp
            availableFloors={availableFloors} //TODO temp
            currentFloor={defaultFloor}
            onSelectFloor={(floor: number) => setFloor(floor)}
          />

          <MapSettings
            wheelchairOnly={wheelchairOnly} //TODO temp
            setWheelchairOnly={setWheelchairOnly} //TODO temp
            poiFilters={poiFilters} //TODO temp
            setPoiFilters={setPoiFilters} //TODO temp
          />
          <IndoorNavigationControls
            instruction={instruction}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
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

function getFirstFloor(info: BuildingFloorInfo) {
  const firstFloor = Object.keys(info.images).sort((a, b) => Number(a) - Number(b))[0];
  return Number(firstFloor);
}

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
