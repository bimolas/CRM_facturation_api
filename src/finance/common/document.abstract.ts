import { DocumentItem } from './document-item.entity.js';
import { InvoiceCalculatorService } from '../../domain-services/invoice-calculator.service.js';

/**
 * Abstract base class for all financial documents (Devis, BonDeCommande, Facture).
 * Provides shared fields and delegated total calculation.
 * The `workflow` property is typed as `unknown` here to avoid a circular dependency
 * at the abstract level; concrete subclasses may cast it to `BusinessWorkflow`.
 */
export abstract class Document {
  id: number;
  referenceNumber: string;
  issueDate: Date;

  /** Reference to the parent workflow — kept loosely typed to prevent circular imports. */
  workflow: unknown;

  items: DocumentItem[] = [];

  subTotalHT: number = 0;
  totalTVA: number = 0;
  totalTTC: number = 0;

  /**
   * Delegates total computation to the domain InvoiceCalculatorService,
   * then caches the results on this document.
   */
  calculateTotals(calculator: InvoiceCalculatorService): void {
    this.subTotalHT = calculator.computeHT(this.items);
    this.totalTVA = calculator.computeTVA(this.items);
    this.totalTTC = calculator.computeTTC(this.items);
  }
}
