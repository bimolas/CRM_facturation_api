import { WorkflowState } from '../interfaces/workflow-state.interface.js';

export class TestingState implements WorkflowState {
  handlePublish(): void {
    console.warn('[TestingState] Cannot publish during client testing.');
  }
  handleSubmitBid(): void {
    console.warn('[TestingState] Bidding is closed.');
  }
  handleAcceptBid(): void {
    console.warn('[TestingState] Bid already accepted.');
  }
  handleExecution(): void {
    console.warn('[TestingState] Redirecting back to execution for fixes.');
  }
  handleComplete(): void {
    console.log('[TestingState → InvoicedState] Client sign-off received — final invoicing initiated.');
  }
}
