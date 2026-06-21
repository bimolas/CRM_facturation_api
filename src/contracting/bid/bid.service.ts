import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Devis } from '../../finance/devis/devis.entity.js';
import { BonDeCommande } from '../../finance/bon-de-commande/bon-de-commande.entity.js';
import { NegotiationMessage } from '../negotiation/negotiation-message.entity.js';

@Injectable()
export class BidService {
  constructor(
    @InjectRepository(Devis)
    private readonly devisRepo: Repository<Devis>,
    @InjectRepository(BonDeCommande)
    private readonly bcRepo: Repository<BonDeCommande>,
    @InjectRepository(NegotiationMessage)
    private readonly messageRepo: Repository<NegotiationMessage>,
  ) {}

  async getMyBids(companyId: number): Promise<object[]> {
    console.log("Fetching bids for Company ID:", companyId);

    const bids = await this.devisRepo.find({
      where: { biddingSeller: { id: companyId } },
      relations: ['biddingSeller', 'workflow', 'workflow.buyerCompany'],
      order: { id: 'DESC' },
    });

    console.log(`Found ${bids.length} bids for Company ID ${companyId}`);

    const result = await Promise.all(
      bids.map(async (bid) => {
        let bcDetails: BonDeCommande | null = null;
        if (bid.bidStatus === 'BC_PENDING_VENDOR') {
          bcDetails = await this.bcRepo.findOne({
            where: { acceptedDevis: { id: bid.id } },
          });
        }
        return {
          id: bid.id,
          referenceNumber: bid.referenceNumber,
          totalTTC: bid.totalTTC,
          bidStatus: bid.bidStatus,
          revisionNumber: bid.revisionNumber,
          issueDate: bid.issueDate,
          validUntil: bid.validUntil,
          workflowId: (bid.workflow as any)?.id ?? null,
          workflowTitle: (bid.workflow as any)?.title ?? null,
          buyerCompanyId: (bid.workflow as any)?.buyerCompany?.id ?? null,
          buyerCompanyName: (bid.workflow as any)?.buyerCompany?.name ?? null,
          sellerCompanyId: bid.biddingSeller?.id ?? null,
          sellerCompanyName: bid.biddingSeller?.name ?? null,
          bc: bcDetails,
        };
      }),
    );

    return result;
  }

  async getBidDetail(bidId: number, actorCompanyId: number): Promise<object> {
    const bid = await this.devisRepo.findOne({
      where: { id: bidId },
      relations: ['biddingSeller', 'workflow', 'workflow.buyerCompany', 'items'],
    });
    if (!bid) throw new NotFoundException(`Bid #${bidId} not found`);

    const isBuyer = (bid.workflow as any)?.buyerCompany?.id === actorCompanyId;
    const isSeller = bid.biddingSeller?.id === actorCompanyId;
    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('You do not have access to this bid');
    }

    const messages = await this.messageRepo.find({
      where: { bid: { id: bidId } },
      relations: ['senderCompany', 'senderUser'],
      order: { createdAt: 'ASC' },
    });

    return { ...bid, negotiationThread: messages };
  }
}
