import { ProjectExecutionStrategy } from './project-execution.strategy.js';
import { StockAllocation } from '../stock-allocation/stock-allocation.entity.js';

export class MaterialProjectStrategy implements ProjectExecutionStrategy {
  allocations: StockAllocation[] = [];
  deliveryStatus: string = 'PENDING';

  initializeWorkspace(): void {
    console.log('[MaterialProjectStrategy] Workspace initialized — stock allocations cleared.');
    this.allocations = [];
    this.deliveryStatus = 'PENDING';
  }

  processFulfillmentUpdate(updatePayload: Record<string, unknown>): void {
    if (updatePayload['deliveryStatus']) {
      this.deliveryStatus = updatePayload['deliveryStatus'] as string;
    }
    console.log(`[MaterialProjectStrategy] Fulfillment updated → deliveryStatus: ${this.deliveryStatus}`);
  }

  getCompletionPercentage(): number {
    if (this.allocations.length === 0) return 0;
    const dispatched = this.allocations.filter((a) => a.isDispatched).length;
    return Math.round((dispatched / this.allocations.length) * 100);
  }

  verifyReadyForClientTesting(): boolean {
    const allDispatched = this.allocations.every((a) => a.isDispatched);
    console.log(`[MaterialProjectStrategy] Ready for client testing: ${allDispatched}`);
    return allDispatched;
  }
}
