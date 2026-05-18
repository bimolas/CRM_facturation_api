import { StockAllocation } from './stock-allocation.entity.js';

export abstract class IStockAllocationRepository {
  abstract findByWorkflow(workflowId: number): Promise<StockAllocation[]>;
  abstract findOne(id: number): Promise<StockAllocation | null>;
  abstract save(allocation: StockAllocation): Promise<StockAllocation>;
  abstract remove(allocation: StockAllocation): Promise<void>;
}
