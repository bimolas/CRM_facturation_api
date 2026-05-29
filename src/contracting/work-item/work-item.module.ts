import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkItem } from './work-item.entity.js';
import { Task } from '../task/task.entity.js';
import { PaymentInstallment } from '../payment/payment-installment.entity.js';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';
import { Team } from '../../teams/team.entity.js';
import { WorkItemService } from './work-item.service.js';
import { WorkItemController } from './work-item.controller.js';
import { WorkflowsWorkItemController } from './workflows-work-item.controller.js';
import { DomainServicesModule } from '../../domain-services/domain-services.module.js';
import { NotificationModule } from '../../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkItem, Task, PaymentInstallment, BusinessWorkflow, Team]),
    DomainServicesModule,
    NotificationModule,
  ],
  providers: [WorkItemService],
  controllers: [WorkItemController, WorkflowsWorkItemController],
  exports: [WorkItemService],
})
export class WorkItemModule {}
