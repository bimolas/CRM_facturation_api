import { Injectable } from '@nestjs/common';
import { DocumentItem } from '../finance/common/document-item.entity.js';

@Injectable()
export class InvoiceCalculatorService {
  /** Method 1 & 2: Calculate Line HT (Standard + Line-level Discounts) */
  computeLineHT(item: DocumentItem): number {
    const rawHT = Number(item.unitPriceHT) * Number(item.quantity);
    const discount = Number(item.discountAmount) || 0;
    return Math.max(0, rawHT - discount); // Prevent negative line total
  }

  /** Method 4: Category-based TVA */
  getLineTvaRate(item: DocumentItem): number {
    if (item.article && item.article.category) {
      return Number(item.article.category.tvaRate);
    }
    return Number(item.appliedTvaRate) || 0;
  }

  computeLineTVA(item: DocumentItem): number {
    const lineHT = this.computeLineHT(item);
    const tvaRate = this.getLineTvaRate(item);
    return lineHT * (tvaRate / 100);
  }

  computeHT(items: DocumentItem[]): number {
    return items.reduce((sum, item) => sum + this.computeLineHT(item), 0);
  }

  computeTVA(items: DocumentItem[]): number {
    return items.reduce((sum, item) => sum + this.computeLineTVA(item), 0);
  }

  computeTTC(items: DocumentItem[]): number {
    return this.computeHT(items) + this.computeTVA(items);
  }

  /**
   * Compute and apply all totals to a document in-place.
   * Method 3: Global Discounts
   */
  applyTotals<T extends { items: DocumentItem[]; subTotalHT: number; totalTVA: number; totalTTC: number; globalDiscountPercentage?: number }>(
    doc: T,
  ): T {
    const rawHT = this.computeHT(doc.items);
    const rawTVA = this.computeTVA(doc.items);

    const globalDiscountRate = Number(doc.globalDiscountPercentage) || 0;
    const globalDiscountMultiplier = Math.max(0, 1 - (globalDiscountRate / 100));

    doc.subTotalHT = rawHT * globalDiscountMultiplier;
    doc.totalTVA = rawTVA * globalDiscountMultiplier;
    doc.totalTTC = doc.subTotalHT + doc.totalTVA;
    
    return doc;
  }
}
