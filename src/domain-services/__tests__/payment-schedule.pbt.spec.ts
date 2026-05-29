// Feature: contract-and-bidding, Property 3: payment schedule has ceil(months) installments, no weekend due dates
import * as fc from 'fast-check';
import { PaymentScheduleService } from '../payment-schedule.service.js';

const paymentScheduleService = new PaymentScheduleService();

/**
 * Count calendar months between two dates (inclusive of both endpoints' months).
 * e.g. Jan 15 → Mar 10 = 3 months (Jan, Feb, Mar)
 */
function monthsBetween(startDate: Date, endDate: Date): number {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();
  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
}

/**
 * Arbitrary that generates a [startDate, endDate] pair where endDate > startDate
 * and the range is within 5 years.
 */
function arbitrarySubscriptionDateRange(): fc.Arbitrary<{ startDate: Date; endDate: Date }> {
  return fc
    .tuple(
      fc.integer({ min: 2020, max: 2028 }),
      fc.integer({ min: 0, max: 11 }),
      fc.integer({ min: 1, max: 36 }), // months to add for endDate
    )
    .map(([year, month, monthsToAdd]) => {
      const startDate = new Date(year, month, 1);
      const endYear = year + Math.floor((month + monthsToAdd) / 12);
      const endMonth = (month + monthsToAdd) % 12;
      const endDate = new Date(endYear, endMonth, 15);
      return { startDate, endDate };
    });
}

describe('PaymentScheduleService — Property 3: Payment Schedule Completeness', () => {
  it('should generate exactly ceil(monthsBetween) installments with no weekend due dates', () => {
    fc.assert(
      fc.property(
        arbitrarySubscriptionDateRange(),
        fc.float({ min: 1, max: 100000, noNaN: true }),
        ({ startDate, endDate }, monthlyAmount) => {
          const installments = paymentScheduleService.generate(startDate, endDate, monthlyAmount);
          const expectedCount = monthsBetween(startDate, endDate);

          const correctCount = installments.length === expectedCount;
          const noWeekends = installments.every((i) => {
            const day = i.dueDate.getDay();
            return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
          });

          return correctCount && noWeekends;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('firstBusinessDayOfMonth should never return a weekend', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 0, max: 11 }),
        (year, month) => {
          const result = paymentScheduleService.firstBusinessDayOfMonth(year, month);
          const day = result.getDay();
          return day !== 0 && day !== 6;
        },
      ),
      { numRuns: 100 },
    );
  });
});
