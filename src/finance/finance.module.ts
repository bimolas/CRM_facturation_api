import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './common/document.entity.js';
import { DocumentItem } from './common/document-item.entity.js';
import { Devis } from './devis/devis.entity.js';
import { BonDeCommande } from './bon-de-commande/bon-de-commande.entity.js';
import { Facture } from './facture/facture.entity.js';
import { Paiement } from './paiement/paiement.entity.js';
import { TypeOrmDocumentRepository } from './common/typeorm-document.repository.js';
import { TypeOrmPaiementRepository } from './paiement/typeorm-paiement.repository.js';
import { DomainServicesModule } from '../domain-services/domain-services.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentItem, Devis, BonDeCommande, Facture, Paiement]),
    DomainServicesModule,
  ],
  providers: [
    TypeOrmDocumentRepository,
    TypeOrmPaiementRepository,
    { provide: 'IDocumentRepository', useClass: TypeOrmDocumentRepository },
    { provide: 'IPaiementRepository', useClass: TypeOrmPaiementRepository },
  ],
  exports: ['IDocumentRepository', 'IPaiementRepository', DomainServicesModule],
})
export class FinanceModule { }
