import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devis } from '../../finance/devis/devis.entity.js';
import { BonDeCommande } from '../../finance/bon-de-commande/bon-de-commande.entity.js';
import { NegotiationMessage } from '../negotiation/negotiation-message.entity.js';
import { BidService } from './bid.service.js';
import { BidController } from './bid.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Devis, BonDeCommande, NegotiationMessage])],
  providers: [BidService],
  controllers: [BidController],
  exports: [BidService],
})
export class BidModule {}
