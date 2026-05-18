import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockAllocation } from './stock-allocation.entity.js';
import { IStockAllocationRepository } from './stock-allocation.repository.interface.js';

@Injectable()
export class TypeOrmStockAllocationRepository extends IStockAllocationRepository {
  constructor(
    @InjectRepository(StockAllocation)
    private readonly repo: Repository<StockAllocation>,
  ) {
    super();
  }

  findByWorkflow(workflowId: number): Promise<StockAllocation[]> {
    return this.repo.find({
      where: { workflow: { id: workflowId } },
      relations: ['targetItem'],
    });
  }

  findOne(id: number): Promise<StockAllocation | null> {
    return this.repo.findOne({ where: { id }, relations: ['targetItem'] });
  }

  async save(allocation: StockAllocation): Promise<StockAllocation> {
    return this.repo.save(allocation);
  }

  async remove(allocation: StockAllocation): Promise<void> {
    await this.repo.remove(allocation);
  }
}
