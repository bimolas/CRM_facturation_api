import { WorkflowState } from '../interfaces/workflow-state.interface.js';

export class DraftState implements WorkflowState {
  handlePublish(): void {
    console.log('[DraftState → PublishedState] Workflow published to marketplace.');
  }
  handleSubmitBid(): void {
    console.warn('[DraftState] Cannot submit a bid on a DRAFT workflow.');
  }
  handleAcceptBid(): void {
    console.warn('[DraftState] Cannot accept a bid on a DRAFT workflow.');
  }
  handleExecution(): void {
    console.warn('[DraftState] Cannot start execution from DRAFT.');
  }
  handleComplete(): void {
    console.warn('[DraftState] Cannot complete a DRAFT workflow.');
  }
}
