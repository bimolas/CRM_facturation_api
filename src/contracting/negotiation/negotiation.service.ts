import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NegotiationMessage, NegotiationMessageType } from './negotiation-message.entity.js';
import { Devis } from '../../finance/devis/devis.entity.js';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';
import { NotificationService } from '../../notification/notification.service.js';

@Injectable()
export class NegotiationService {
  constructor(
    @InjectRepository(NegotiationMessage)
    private readonly messageRepo: Repository<NegotiationMessage>,
    @InjectRepository(Devis)
    private readonly devisRepo: Repository<Devis>,
    @InjectRepository(BusinessWorkflow)
    private readonly workflowRepo: Repository<BusinessWorkflow>,
    private readonly notificationService: NotificationService,
  ) {}

  async sendMessage(
    workflowId: number,
    bidId: number,
    actorUserId: number,
    actorCompanyId: number,
    content: string,
  ): Promise<NegotiationMessage> {
    const workflow = await this.workflowRepo.findOne({
      where: { id: workflowId },
      relations: ['buyerCompany', 'chosenSellerCompany'],
    });
    if (!workflow) throw new NotFoundException(`Workflow #${workflowId} not found`);

    const bid = await this.devisRepo.findOne({
      where: { id: bidId },
      relations: ['biddingSeller'],
    });
    if (!bid) throw new NotFoundException(`Bid #${bidId} not found`);

    const isBuyer = workflow.buyerCompany?.id === actorCompanyId;
    const isBiddingSeller = bid.biddingSeller?.id === actorCompanyId;

    if (!isBuyer && !isBiddingSeller) {
      throw new ForbiddenException('Only the buyer or the bidding seller can send negotiation messages');
    }

    const messageType = isBuyer
      ? NegotiationMessageType.BUYER_MESSAGE
      : NegotiationMessageType.VENDOR_MESSAGE;

    // Update bid status to NEGOTIATING if it was SUBMITTED
    if (bid.bidStatus === 'SUBMITTED') {
      bid.bidStatus = 'NEGOTIATING';
      await this.devisRepo.save(bid);
    }

    const senderCompany = isBuyer ? workflow.buyerCompany : bid.biddingSeller;
    if (!senderCompany) {
      throw new ForbiddenException('Sender company could not be resolved');
    }

    const message = this.messageRepo.create({
      bid,
      workflow,
      senderCompany,
      senderUser: { id: actorUserId } as any,
      content,
      messageType,
    });

    const saved = await this.messageRepo.save(message) as NegotiationMessage;

    // Notify the other party
    const recipientCompany = isBuyer ? bid.biddingSeller : workflow.buyerCompany;
    if (recipientCompany) {
      await this.notificationService.createNotification(
        `New negotiation message on bid #${bidId} for workflow "${workflow.title}".`,
        'MESSAGE',
        undefined,
        recipientCompany,
      );
    }

    return saved;
  }

  async getThread(
    workflowId: number,
    bidId: number,
    actorCompanyId: number,
  ): Promise<NegotiationMessage[]> {
    const workflow = await this.workflowRepo.findOne({
      where: { id: workflowId },
      relations: ['buyerCompany'],
    });
    if (!workflow) throw new NotFoundException(`Workflow #${workflowId} not found`);

    const bid = await this.devisRepo.findOne({
      where: { id: bidId },
      relations: ['biddingSeller'],
    });
    if (!bid) throw new NotFoundException(`Bid #${bidId} not found`);

    const isBuyer = workflow.buyerCompany?.id === actorCompanyId;
    const isBiddingSeller = bid.biddingSeller?.id === actorCompanyId;

    if (!isBuyer && !isBiddingSeller) {
      throw new ForbiddenException('Only the buyer or the bidding seller can view negotiation messages');
    }

    return this.messageRepo.find({
      where: { bid: { id: bidId }, workflow: { id: workflowId } },
      relations: ['senderCompany', 'senderUser'],
      order: { createdAt: 'ASC' },
    }) as Promise<NegotiationMessage[]>;
  }
}
