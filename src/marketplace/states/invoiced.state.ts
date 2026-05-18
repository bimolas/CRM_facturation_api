import { WorkflowState } from '../interfaces/workflow-state.interface.js';

export class InvoicedState implements WorkflowState {
  handlePublish(): void {
    console.warn('[InvoicedState] Workflow is fully invoiced and closed.');
  }
  handleSubmitBid(): void {
    console.warn('[InvoicedState] Workflow is closed — no bids accepted.');
  }
  handleAcceptBid(): void {
    console.warn('[InvoicedState] Workflow is closed.');
  }
  handleExecution(): void {
    console.warn('[InvoicedState] Workflow is closed.');
  }
  handleComplete(): void {
    console.log('[InvoicedState] Workflow is already fully invoiced and complete.');
  }
}
