import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paiement } from './paiement.entity.js';
import { IPaiementRepository } from './paiement.repository.interface.js';

@Injectable()
export class TypeOrmPaiementRepository extends IPaiementRepository {
  constructor(
    @InjectRepository(Paiement)
    private readonly repo: Repository<Paiement>,
  ) {
    super();
  }

  findByFacture(factureId: number): Promise<Paiement[]> {
    return this.repo.find({ where: { facture: { id: factureId } } });
  }

  async save(paiement: Paiement): Promise<Paiement> {
    return this.repo.save(paiement);
  }

  async remove(paiement: Paiement): Promise<void> {
    await this.repo.remove(paiement);
  }
}
