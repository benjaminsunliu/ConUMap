export type OutdoorRouteStep = {
  encodedPolyline: string;
  travelMode: string;
};

class OutdoorStepResumeStore {
  private continuationCounter = 0;

  private readonly continuations = new Map<string, OutdoorRouteStep>();

  private pendingStep: OutdoorRouteStep | null = null;

  public saveContinuation(step: OutdoorRouteStep) {
    const continuationId = `outdoor-step-${this.continuationCounter++}`;
    this.continuations.set(continuationId, step);
    return continuationId;
  }

  public getContinuation(continuationId: string) {
    return this.continuations.get(continuationId) ?? null;
  }

  public clearContinuation(continuationId: string) {
    this.continuations.delete(continuationId);
  }

  public setPendingStep(step: OutdoorRouteStep) {
    this.pendingStep = step;
  }

  public consumePendingStep() {
    const nextStep = this.pendingStep;
    this.pendingStep = null;
    return nextStep;
  }

  public reset() {
    this.continuations.clear();
    this.pendingStep = null;
    this.continuationCounter = 0;
  }
}

export const OutdoorStepResume = new OutdoorStepResumeStore();
