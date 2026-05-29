import { Injectable } from '@nestjs/common';
import { WorkItem } from '../contracting/work-item/work-item.entity.js';

@Injectable()
export class CalendarConflictService {
  /**
   * Returns all Monday–Friday dates in the range [startDate, endDate] inclusive,
   * excluding any date that appears in the holidays array.
   *
   * Requirements: 8.3, 9.3, Property 4
   */
  getBusinessDays(startDate: Date, endDate: Date, holidays: Date[]): Date[] {
    const holidaySet = new Set(
      holidays.map((h) => h.toISOString().split('T')[0]),
    );

    const result: Date[] = [];
    const current = new Date(startDate);
    // Normalize to midnight to avoid time-of-day issues
    current.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
      const dateStr = current.toISOString().split('T')[0];

      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
        result.push(new Date(current));
      }

      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  /**
   * Detects material conflicts between work items by checking if their date
   * ranges overlap: startA <= endB && startB <= endA.
   *
   * The caller is responsible for passing only the relevant work items for the
   * seller company. All passed work items are treated as belonging to the seller.
   *
   * Returns a Map where key = workItemId, value = array of conflicting workItemIds.
   * Only items with at least one conflict appear in the map.
   *
   * Requirements: 8.3, Property 4
   */
  detectMaterialConflicts(
    workItems: WorkItem[],
    _sellerCompanyId: number,
  ): Map<number, number[]> {
    const conflicts = new Map<number, number[]>();

    for (let i = 0; i < workItems.length; i++) {
      for (let j = i + 1; j < workItems.length; j++) {
        const a = workItems[i];
        const b = workItems[j];

        const startA = new Date(a.startDate);
        const endA = new Date(a.endDate);
        const startB = new Date(b.startDate);
        const endB = new Date(b.endDate);

        // Overlap condition: startA <= endB && startB <= endA
        if (startA <= endB && startB <= endA) {
          if (!conflicts.has(a.id)) conflicts.set(a.id, []);
          if (!conflicts.has(b.id)) conflicts.set(b.id, []);
          conflicts.get(a.id)!.push(b.id);
          conflicts.get(b.id)!.push(a.id);
        }
      }
    }

    return conflicts;
  }

  /**
   * Detects service conflicts between work items by checking if their sets of
   * business days (Monday–Friday, excluding holidays) intersect.
   *
   * The caller is responsible for passing only the relevant work items for the
   * seller company. All passed work items are treated as belonging to the seller.
   *
   * Returns a Map where key = workItemId, value = array of conflicting workItemIds.
   * Only items with at least one conflict appear in the map.
   *
   * Requirements: 9.3, Property 4
   */
  detectServiceConflicts(
    workItems: WorkItem[],
    holidays: Date[],
    _sellerCompanyId: number,
  ): Map<number, number[]> {
    const conflicts = new Map<number, number[]>();

    // Pre-compute business day sets for each work item
    const businessDaySets = workItems.map((item) => {
      const days = this.getBusinessDays(
        new Date(item.startDate),
        new Date(item.endDate),
        holidays,
      );
      return new Set(days.map((d) => d.toISOString().split('T')[0]));
    });

    for (let i = 0; i < workItems.length; i++) {
      for (let j = i + 1; j < workItems.length; j++) {
        const setA = businessDaySets[i];
        const setB = businessDaySets[j];

        // Check if the two sets intersect
        let hasIntersection = false;
        for (const day of setA) {
          if (setB.has(day)) {
            hasIntersection = true;
            break;
          }
        }

        if (hasIntersection) {
          const idA = workItems[i].id;
          const idB = workItems[j].id;

          if (!conflicts.has(idA)) conflicts.set(idA, []);
          if (!conflicts.has(idB)) conflicts.set(idB, []);
          conflicts.get(idA)!.push(idB);
          conflicts.get(idB)!.push(idA);
        }
      }
    }

    return conflicts;
  }
}
