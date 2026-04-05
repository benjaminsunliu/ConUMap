export type IndoorNavigationMode = "floor" | "step";

export type IndoorNavigationCommand = Readonly<{
  label: string;
  canExecute: boolean;
  execute: () => void;
}>;

export type IndoorNavigationControlsState = Readonly<{
  currentFloor: number;
  currentStep: number;
  totalSteps: number;
  mode: IndoorNavigationMode;
  nextCommand: IndoorNavigationCommand;
  previousCommand: IndoorNavigationCommand;
  stepInstruction?: string;
}>;

type BaseIndoorNavigationCommandSetOptions = {
  currentFloor: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
};

type StepNavigationCommandSetOptions = BaseIndoorNavigationCommandSetOptions & {
  currentStep: number;
  totalSteps: number;
  stepInstruction?: string;
};

export function createFloorNavigationCommandSet({
  currentFloor,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: BaseIndoorNavigationCommandSetOptions): IndoorNavigationControlsState {
  return {
    currentFloor,
    currentStep: 1,
    totalSteps: 1,
    mode: "floor",
    nextCommand: createNavigationCommand("Next Floor", canGoNext, onNext),
    previousCommand: createNavigationCommand("Prev Floor", canGoPrevious, onPrevious),
  };
}

export function createStepNavigationCommandSet({
  currentFloor,
  currentStep,
  totalSteps,
  stepInstruction,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: StepNavigationCommandSetOptions): IndoorNavigationControlsState {
  return {
    currentFloor,
    currentStep,
    totalSteps,
    mode: "step",
    nextCommand: createNavigationCommand("Next Step", canGoNext, onNext),
    previousCommand: createNavigationCommand("Prev Step", canGoPrevious, onPrevious),
    stepInstruction,
  };
}

function createNavigationCommand(
  label: string,
  canExecute: boolean,
  execute: () => void,
): IndoorNavigationCommand {
  return {
    label,
    canExecute,
    execute,
  };
}
