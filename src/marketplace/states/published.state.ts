import { WorkflowState } from '../interfaces/workflow-state.interface.js';

export class PublishedState implements WorkflowState {
  handlePublish(): void {
    console.warn('[PublishedState] Workflow is already published.');
  }
  handleSubmitBid(): void {
    console.log('[PublishedState → EvaluationState] Bid submitted — entering evaluation phase.');
  }
  handleAcceptBid(): void {
    console.warn('[PublishedState] No bid to accept yet — submit a bid first.');
  }
  handleExecution(): void {
    console.warn('[PublishedState] Cannot start execution before a bid is accepted.');
  }
  handleComplete(): void {
    console.warn('[PublishedState] Cannot complete a workflow still in evaluation.');
  }
}
