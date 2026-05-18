import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTask } from './project-task/project-task.entity.js';
import { InventoryItem } from './inventory/inventory-item.entity.js';
import { StockAllocation } from './stock-allocation/stock-allocation.entity.js';
import { TypeOrmProjectTaskRepository } from './project-task/typeorm-project-task.repository.js';
import { TypeOrmInventoryItemRepository } from './inventory/typeorm-inventory-item.repository.js';
import { TypeOrmStockAllocationRepository } from './stock-allocation/typeorm-stock-allocation.repository.js';
import { ProjectMilestone } from './milestone/project-milestone.entity.js';
import { TypeOrmProjectMilestoneRepository } from './milestone/typeorm-project-milestone.repository.js';
import { ProjectMilestoneService } from './milestone/project-milestone.service.js';
import { InventoryController } from './inventory/inventory.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTask, InventoryItem, StockAllocation, ProjectMilestone])],
  controllers: [InventoryController],
  providers: [
    TypeOrmProjectTaskRepository,
    TypeOrmInventoryItemRepository,
    TypeOrmStockAllocationRepository,
    TypeOrmProjectMilestoneRepository,
    ProjectMilestoneService,
    { provide: 'IProjectTaskRepository', useClass: TypeOrmProjectTaskRepository },
    { provide: 'IInventoryItemRepository', useClass: TypeOrmInventoryItemRepository },
    { provide: 'IStockAllocationRepository', useClass: TypeOrmStockAllocationRepository },
    { provide: 'IProjectMilestoneRepository', useClass: TypeOrmProjectMilestoneRepository },
  ],
  exports: [
    'IProjectTaskRepository',
    'IInventoryItemRepository',
    'IStockAllocationRepository',
    'IProjectMilestoneRepository',
    ProjectMilestoneService,
  ],
})
export class ExecutionModule {}
