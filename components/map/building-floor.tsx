import { BuildingFloorInfo } from "@/types/mapTypes";
import { Image, StyleSheet, View } from "react-native";
import data from "@/data/buildings/floors/H/jsonData/H.json";
import { useMemo, useState, useEffect } from "react";
import { BuildingNavigation } from "@/globals/BuildingRoomsStore";
import FloorSelector from "./floor-selection-menu";
import MapSettings from "./indoor-map-settings";
import IndoorNavigationControls from "./indoor-navigation-controls";

interface BuildingFloorProps {
  info: BuildingFloorInfo;
}

type Step = {
  instruction: string;
  floor?: number;
  coordinates?: { x: number; y: number };
};

export default function BuildingFloor({
  info: { imageURI },
}: Readonly<BuildingFloorProps>) {
  const [currentFloor, setCurrentFloor] = useState(1);
  const graph = useMemo(() => {
    return BuildingNavigation.createGraphFromObject(data);
  }, []);

  //TODO temp
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
    if (currentStep.floor && currentStep.floor !== currentFloor) {
      setCurrentFloor(currentStep.floor);
    }
  }, [currentFloor, currentStep.floor, currentStepIndex]);

  return (
    <View style={styles.container}>
      <Image source={imageURI} style={styles.image} resizeMode="contain" />

      <FloorSelector
        buildingName="Hall" //TODO temp
        availableFloors={[1, 2, 3, 4, 5, 6, 7, 8, 9]} //TODO temp
        currentFloor={currentFloor}
        onSelectFloor={(floor: number) => setCurrentFloor(floor)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
