export interface WorkflowState {
  handlePublish(): void;
  handleSubmitBid(): void;
  handleAcceptBid(): void;
  handleExecution(): void;
  handleComplete(): void;
}
