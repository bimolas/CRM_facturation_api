export interface ProjectExecutionStrategy {
  initializeWorkspace(): void;
  processFulfillmentUpdate(updatePayload: Record<string, unknown>): void;
  getCompletionPercentage(): number;
  verifyReadyForClientTesting(): boolean;
}
