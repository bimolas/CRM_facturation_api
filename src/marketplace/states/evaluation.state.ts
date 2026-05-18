import { WorkflowState } from '../interfaces/workflow-state.interface.js';

export class EvaluationState implements WorkflowState {
  handlePublish(): void {
    console.warn('[EvaluationState] Cannot re-publish during evaluation.');
  }
  handleSubmitBid(): void {
    console.log('[EvaluationState] Additional bid received and registered.');
  }
  handleAcceptBid(): void {
    console.log('[EvaluationState → ExecutionState] Bid accepted — project awarded to seller.');
  }
  handleExecution(): void {
    console.warn('[EvaluationState] Accept a bid first before starting execution.');
  }
  handleComplete(): void {
    console.warn('[EvaluationState] Cannot complete during bid evaluation.');
  }
}
