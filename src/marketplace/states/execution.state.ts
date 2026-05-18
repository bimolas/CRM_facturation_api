import { WorkflowState } from '../interfaces/workflow-state.interface.js';

export class ExecutionState implements WorkflowState {
  handlePublish(): void {
    console.warn('[ExecutionState] Cannot publish an in-progress workflow.');
  }
  handleSubmitBid(): void {
    console.warn('[ExecutionState] Bidding is closed — project is in execution.');
  }
  handleAcceptBid(): void {
    console.warn('[ExecutionState] Bid already accepted.');
  }
  handleExecution(): void {
    console.log('[ExecutionState] Execution progress updated.');
  }
  handleComplete(): void {
    console.log('[ExecutionState → TestingState] Deliverable submitted — entering client testing phase.');
  }
}
