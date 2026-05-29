// Feature: contract-and-bidding, Property 1: totalTTC = subTotalHT + totalTVA for any item array
import * as fc from 'fast-check';
import { InvoiceCalculatorService } from '../invoice-calculator.service.js';
import { DocumentItem } from '../../finance/common/document-item.entity.js';

const calculator = new InvoiceCalculatorService();

function arbitraryDocumentItem(): fc.Arbitrary<DocumentItem> {
  return fc.record({
    unitPriceHT: fc.float({ min: 0, max: 10000, noNaN: true }),
    quantity: fc.integer({ min: 1, max: 100 }),
    discountAmount: fc.float({ min: 0, max: 500, noNaN: true }),
    appliedTvaRate: fc.float({ min: 0, max: 20, noNaN: true }),
  }).map((r) => {
    const item = new DocumentItem();
    item.unitPriceHT = r.unitPriceHT;
    item.quantity = r.quantity;
    item.discountAmount = r.discountAmount;
    item.appliedTvaRate = r.appliedTvaRate;
    item.article = null as any;
    return item;
  });
}

describe('InvoiceCalculatorService — Property 1: Bid Total Calculation Invariant', () => {
  it('totalTTC should equal subTotalHT + totalTVA for any item array and global discount', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryDocumentItem(), { minLength: 1, maxLength: 20 }),
        fc.float({ min: 0, max: 50, noNaN: true }),
        (items, globalDiscountPercentage) => {
          const doc = {
            items,
            globalDiscountPercentage,
            subTotalHT: 0,
            totalTVA: 0,
            totalTTC: 0,
          };
          calculator.applyTotals(doc);
          return Math.abs(doc.totalTTC - (doc.subTotalHT + doc.totalTVA)) < 0.001;
        },
      ),
      { numRuns: 100 },
    );
  });
});
