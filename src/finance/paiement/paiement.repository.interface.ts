import { Paiement } from './paiement.entity.js';

export abstract class IPaiementRepository {
  abstract findByFacture(factureId: number): Promise<Paiement[]>;
  abstract save(paiement: Paiement): Promise<Paiement>;
  abstract remove(paiement: Paiement): Promise<void>;
}
