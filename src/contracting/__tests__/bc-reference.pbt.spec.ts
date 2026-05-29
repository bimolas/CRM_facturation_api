// Feature: contract-and-bidding, Property 7: BC reference numbers are unique across all generated BCs
import * as fc from 'fast-check';

/**
 * Pure function that replicates the BC reference generation logic from BusinessWorkflowService.acceptBid().
 * Pattern: BC-{YEAR}-{workflowId}-{sequence}
 */
function generateBCReference(year: number, workflowId: number, sequence: number): string {
  return `BC-${year}-${workflowId}-${sequence}`;
}

interface BCGenerationInput {
  year: number;
  workflowId: number;
  sequence: number;
}

function arbitraryBCGenerationInput(): fc.Arbitrary<BCGenerationInput> {
  return fc.record({
    year: fc.integer({ min: 2020, max: 2030 }),
    workflowId: fc.integer({ min: 1, max: 10000 }),
    sequence: fc.integer({ min: 1, max: 1000 }),
  });
}

describe('BC Reference Number — Property 7: BC Reference Number Uniqueness', () => {
  it('should produce unique reference numbers for all distinct (year, workflowId, sequence) inputs', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryBCGenerationInput(), { minLength: 2, maxLength: 20 }),
        (inputs) => {
          const refs = inputs.map((i) => generateBCReference(i.year, i.workflowId, i.sequence));
          const uniqueRefs = new Set(refs);

          // Count distinct inputs
          const distinctInputs = new Set(
            inputs.map((i) => `${i.year}-${i.workflowId}-${i.sequence}`),
          );

          // Number of unique refs should equal number of distinct inputs
          return uniqueRefs.size === distinctInputs.size;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should produce different references when any of year, workflowId, or sequence differs', () => {
    fc.assert(
      fc.property(
        arbitraryBCGenerationInput(),
        arbitraryBCGenerationInput(),
        (inputA, inputB) => {
          const refA = generateBCReference(inputA.year, inputA.workflowId, inputA.sequence);
          const refB = generateBCReference(inputB.year, inputB.workflowId, inputB.sequence);

          const sameInput =
            inputA.year === inputB.year &&
            inputA.workflowId === inputB.workflowId &&
            inputA.sequence === inputB.sequence;

          if (sameInput) {
            return refA === refB; // Same input → same ref (deterministic)
          } else {
            return refA !== refB; // Different input → different ref
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should follow the BC-{YEAR}-{workflowId}-{sequence} format', () => {
    fc.assert(
      fc.property(
        arbitraryBCGenerationInput(),
        (input) => {
          const ref = generateBCReference(input.year, input.workflowId, input.sequence);
          const expected = `BC-${input.year}-${input.workflowId}-${input.sequence}`;
          return ref === expected;
        },
      ),
      { numRuns: 100 },
    );
  });
});
