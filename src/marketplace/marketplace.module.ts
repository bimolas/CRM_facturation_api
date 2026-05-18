import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessWorkflow } from './workflow/business-workflow.entity.js';
import { WorkflowHistory } from './history/workflow-history.entity.js';
import { Devis } from '../finance/devis/devis.entity.js';
import { Document } from '../finance/common/document.entity.js';
import { BusinessWorkflowService } from './workflow/business-workflow.service.js';
import { BusinessWorkflowController } from './workflow/business-workflow.controller.js';
import { TypeOrmBusinessWorkflowRepository } from './workflow/typeorm-business-workflow.repository.js';
import { TypeOrmWorkflowHistoryRepository } from './history/typeorm-workflow-history.repository.js';
import { IdentityModule } from '../identity/identity.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { ExecutionModule } from '../execution/execution.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessWorkflow, WorkflowHistory, Devis, Document]),
    IdentityModule,
    NotificationModule,
    ExecutionModule,
  ],
  controllers: [BusinessWorkflowController],
  providers: [
    TypeOrmBusinessWorkflowRepository,
    TypeOrmWorkflowHistoryRepository,
    { provide: 'IBusinessWorkflowRepository', useClass: TypeOrmBusinessWorkflowRepository },
    { provide: 'IWorkflowHistoryRepository', useClass: TypeOrmWorkflowHistoryRepository },
    BusinessWorkflowService,
  ],
  exports: [BusinessWorkflowService],
})
export class MarketplaceModule {}
