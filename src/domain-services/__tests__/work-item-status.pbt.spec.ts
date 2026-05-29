// Feature: contract-and-bidding, Property 2: WorkItem status derived correctly from task statuses
import * as fc from 'fast-check';
import { WorkItemStatusService } from '../work-item-status.service.js';

const workItemStatusService = new WorkItemStatusService();

describe('WorkItemStatusService — Property 2: Work Item Status Derivation Invariant', () => {
  it('should return COMPLETED when all tasks are completed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ status: fc.constant('completed') }),
          { minLength: 1, maxLength: 50 },
        ),
        (tasks) => {
          return workItemStatusService.derive(tasks) === 'COMPLETED';
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return PENDING when all tasks are todo', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ status: fc.constant('todo') }),
          { minLength: 1, maxLength: 50 },
        ),
        (tasks) => {
          return workItemStatusService.derive(tasks) === 'PENDING';
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return PENDING when task list is empty', () => {
    expect(workItemStatusService.derive([])).toBe('PENDING');
  });

  it('should satisfy the three-way derivation rule for any mix of statuses', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ status: fc.constantFrom('todo', 'in-progress', 'completed') }),
          { minLength: 1, maxLength: 50 },
        ),
        (tasks) => {
          const derived = workItemStatusService.derive(tasks);
          const allCompleted = tasks.every((t) => t.status === 'completed');
          const allTodo = tasks.every((t) => t.status === 'todo');

          if (allCompleted) return derived === 'COMPLETED';
          if (allTodo) return derived === 'PENDING';
          return derived === 'IN_PROGRESS';
        },
      ),
      { numRuns: 100 },
    );
  });
});
