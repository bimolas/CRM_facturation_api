import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NegotiationMessage } from './negotiation-message.entity.js';
import { Devis } from '../../finance/devis/devis.entity.js';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';
import { NegotiationService } from './negotiation.service.js';
import { NegotiationController } from './negotiation.controller.js';
import { NotificationModule } from '../../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([NegotiationMessage, Devis, BusinessWorkflow]),
    NotificationModule,
  ],
  providers: [NegotiationService],
  controllers: [NegotiationController],
  exports: [NegotiationService],
})
export class NegotiationModule {}
