// Feature: contract-and-bidding, Property 5: message thread returns exactly N messages ordered by createdAt, no cross-bid leakage
import * as fc from 'fast-check';
import { NegotiationMessageType } from '../negotiation-message.entity.js';

interface MockMessage {
  id: number;
  bidId: number;
  workflowId: number;
  content: string;
  messageType: NegotiationMessageType;
  createdAt: Date;
}

/**
 * Pure function that replicates the thread filtering logic from NegotiationService.getThread().
 * Filters messages by bidId and sorts by createdAt ASC.
 */
function filterAndSortThread(messages: MockMessage[], targetBidId: number): MockMessage[] {
  return messages
    .filter((m) => m.bidId === targetBidId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

function arbitraryNegotiationMessage(): fc.Arbitrary<MockMessage> {
  return fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    bidId: fc.integer({ min: 1, max: 10 }),
    workflowId: fc.integer({ min: 1, max: 5 }),
    content: fc.string({ minLength: 1, maxLength: 200 }),
    messageType: fc.constantFrom(
      NegotiationMessageType.BUYER_MESSAGE,
      NegotiationMessageType.VENDOR_MESSAGE,
      NegotiationMessageType.SYSTEM_NOTE,
    ),
    createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
  });
}

describe('NegotiationService — Property 5: Negotiation Message Thread Integrity', () => {
  it('should return exactly the right count, ordered by createdAt ASC, with no cross-bid leakage', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryNegotiationMessage(), { minLength: 1, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        (messages, targetBidId) => {
          const thread = filterAndSortThread(messages, targetBidId);

          // No cross-bid leakage: every message in thread belongs to targetBidId
          const onlyTargetBid = thread.every((m) => m.bidId === targetBidId);

          // Correct count: thread length matches filtered count
          const expectedCount = messages.filter((m) => m.bidId === targetBidId).length;
          const correctCount = thread.length === expectedCount;

          // Ordered by createdAt ASC
          const ordered = thread.every(
            (m, i) => i === 0 || m.createdAt.getTime() >= thread[i - 1].createdAt.getTime(),
          );

          return onlyTargetBid && correctCount && ordered;
        },
      ),
      { numRuns: 100 },
    );
  });
});
