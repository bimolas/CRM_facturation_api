// Feature: contract-and-bidding, Property 4: overlapping seller work items have hasConflict=true, non-overlapping have false
import * as fc from 'fast-check';
import { CalendarConflictService } from '../calendar-conflict.service.js';
import { WorkItem } from '../../contracting/work-item/work-item.entity.js';

const calendarConflictService = new CalendarConflictService();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWorkItem(
  id: number,
  startDate: Date,
  endDate: Date,
  type: 'material' | 'service' | 'subscription' = 'material',
): WorkItem {
  const item = new WorkItem();
  item.id = id;
  item.startDate = startDate;
  item.endDate = endDate;
  item.type = type;
  item.status = 'PENDING';
  item.title = `WorkItem ${id}`;
  item.description = '';
  item.workflow = null as any;
  item.assignedTeam = null;
  item.monthlyAmount = null;
  item.tasks = [];
  return item;
}

/** True when [startA, endA] and [startB, endB] share at least one day. */
function datesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA <= endB && startB <= endA;
}

/** True when two business-day sets (computed without holidays) intersect. */
function businessDaysIntersect(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  const daysA = calendarConflictService.getBusinessDays(startA, endA, []);
  const daysB = calendarConflictService.getBusinessDays(startB, endB, []);
  const setA = new Set(daysA.map((d) => d.toISOString().split('T')[0]));
  return daysB.some((d) => setA.has(d.toISOString().split('T')[0]));
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a pair of work items with arbitrary date ranges and a shared
 * sellerCompanyId. Both items are assigned the given type.
 */
function arbitraryWorkItemPair(
  type: 'material' | 'service' = 'material',
): fc.Arbitrary<{
  workItem1: WorkItem;
  workItem2: WorkItem;
  sellerCompanyId: number;
}> {
  return fc
    .tuple(
      fc.integer({ min: 2024, max: 2026 }),
      fc.integer({ min: 1, max: 300 }), // startA day offset from Jan 1
      fc.integer({ min: 1, max: 60 }),  // durationA in days
      fc.integer({ min: 1, max: 300 }), // startB day offset from Jan 1
      fc.integer({ min: 1, max: 60 }),  // durationB in days
      fc.integer({ min: 1, max: 100 }), // sellerCompanyId
    )
    .map(([year, startAOffset, durationA, startBOffset, durationB, sellerCompanyId]) => {
      const base = new Date(year, 0, 1);
      const startA = new Date(base.getTime() + startAOffset * 86400000);
      const endA = new Date(startA.getTime() + durationA * 86400000);
      const startB = new Date(base.getTime() + startBOffset * 86400000);
      const endB = new Date(startB.getTime() + durationB * 86400000);

      return {
        workItem1: makeWorkItem(1, startA, endA, type),
        workItem2: makeWorkItem(2, startB, endB, type),
        sellerCompanyId,
      };
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CalendarConflictService — Property 4: Calendar Conflict Detection Correctness', () => {
  // -------------------------------------------------------------------------
  // Material conflicts
  // -------------------------------------------------------------------------

  it('overlapping material seller work items should both have conflicts; non-overlapping should not', () => {
    fc.assert(
      fc.property(
        arbitraryWorkItemPair('material'),
        ({ workItem1, workItem2, sellerCompanyId }) => {
          const conflicts = calendarConflictService.detectMaterialConflicts(
            [workItem1, workItem2],
            sellerCompanyId,
          );

          const overlaps = datesOverlap(
            workItem1.startDate,
            workItem1.endDate,
            workItem2.startDate,
            workItem2.endDate,
          );

          const conflict1 = (conflicts.get(workItem1.id)?.length ?? 0) > 0;
          const conflict2 = (conflicts.get(workItem2.id)?.length ?? 0) > 0;

          // Both must agree: either both conflict or neither does
          if (overlaps) {
            return conflict1 && conflict2;
          } else {
            return !conflict1 && !conflict2;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('material conflict map entries are symmetric: if A lists B then B lists A', () => {
    fc.assert(
      fc.property(
        arbitraryWorkItemPair('material'),
        ({ workItem1, workItem2, sellerCompanyId }) => {
          const conflicts = calendarConflictService.detectMaterialConflicts(
            [workItem1, workItem2],
            sellerCompanyId,
          );

          const aListsB = conflicts.get(workItem1.id)?.includes(workItem2.id) ?? false;
          const bListsA = conflicts.get(workItem2.id)?.includes(workItem1.id) ?? false;

          // Symmetry: either both list each other or neither does
          return aListsB === bListsA;
        },
      ),
      { numRuns: 100 },
    );
  });

  // -------------------------------------------------------------------------
  // Buyer-role: passing an empty seller list always yields no conflicts
  // -------------------------------------------------------------------------

  /**
   * Property 4 (design doc): "For any pair of Work Items where the authenticated
   * company is the buyer (not the seller), hasConflict SHALL always be false
   * regardless of date overlap."
   *
   * The service contract is: the caller passes ONLY the seller's work items.
   * When the company is acting as a buyer, it passes an empty list, so the
   * returned conflict map must always be empty.
   */
  it('buyer-role: passing no seller work items always returns an empty conflict map (material)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // buyerCompanyId
        (buyerCompanyId) => {
          const conflicts = calendarConflictService.detectMaterialConflicts(
            [], // buyer has no seller items to check
            buyerCompanyId,
          );
          return conflicts.size === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('buyer-role: passing no seller work items always returns an empty conflict map (service)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // buyerCompanyId
        (buyerCompanyId) => {
          const conflicts = calendarConflictService.detectServiceConflicts(
            [], // buyer has no seller items to check
            [],
            buyerCompanyId,
          );
          return conflicts.size === 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  // -------------------------------------------------------------------------
  // Service conflicts
  // -------------------------------------------------------------------------

  it('overlapping service seller work items (by business days) should both have conflicts; non-overlapping should not', () => {
    fc.assert(
      fc.property(
        arbitraryWorkItemPair('service'),
        ({ workItem1, workItem2, sellerCompanyId }) => {
          const conflicts = calendarConflictService.detectServiceConflicts(
            [workItem1, workItem2],
            [], // no holidays
            sellerCompanyId,
          );

          const intersects = businessDaysIntersect(
            workItem1.startDate,
            workItem1.endDate,
            workItem2.startDate,
            workItem2.endDate,
          );

          const conflict1 = (conflicts.get(workItem1.id)?.length ?? 0) > 0;
          const conflict2 = (conflicts.get(workItem2.id)?.length ?? 0) > 0;

          if (intersects) {
            return conflict1 && conflict2;
          } else {
            return !conflict1 && !conflict2;
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('service conflict map entries are symmetric: if A lists B then B lists A', () => {
    fc.assert(
      fc.property(
        arbitraryWorkItemPair('service'),
        ({ workItem1, workItem2, sellerCompanyId }) => {
          const conflicts = calendarConflictService.detectServiceConflicts(
            [workItem1, workItem2],
            [],
            sellerCompanyId,
          );

          const aListsB = conflicts.get(workItem1.id)?.includes(workItem2.id) ?? false;
          const bListsA = conflicts.get(workItem2.id)?.includes(workItem1.id) ?? false;

          return aListsB === bListsA;
        },
      ),
      { numRuns: 100 },
    );
  });

  // -------------------------------------------------------------------------
  // getBusinessDays invariants
  // -------------------------------------------------------------------------

  it('getBusinessDays should only return Mon–Fri dates', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2024, max: 2026 }),
        fc.integer({ min: 0, max: 300 }),
        fc.integer({ min: 1, max: 30 }),
        (year, startOffset, duration) => {
          const startDate = new Date(year, 0, 1 + startOffset);
          const endDate = new Date(startDate.getTime() + duration * 86400000);
          const businessDays = calendarConflictService.getBusinessDays(startDate, endDate, []);
          return businessDays.every((d) => d.getDay() !== 0 && d.getDay() !== 6);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('getBusinessDays should exclude provided holidays', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2024, max: 2026 }),
        fc.integer({ min: 0, max: 300 }),
        fc.integer({ min: 7, max: 30 }), // at least a week so there are business days
        (year, startOffset, duration) => {
          const startDate = new Date(year, 0, 1 + startOffset);
          const endDate = new Date(startDate.getTime() + duration * 86400000);

          // Pick the first business day in the range as a holiday
          const allDays = calendarConflictService.getBusinessDays(startDate, endDate, []);
          if (allDays.length === 0) return true; // nothing to test

          const holiday = allDays[0];
          const withHoliday = calendarConflictService.getBusinessDays(startDate, endDate, [holiday]);
          const holidayStr = holiday.toISOString().split('T')[0];

          return !withHoliday.some((d) => d.toISOString().split('T')[0] === holidayStr);
        },
      ),
      { numRuns: 100 },
    );
  });
});
