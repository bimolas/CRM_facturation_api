import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkItemStatusService {
  /**
   * Derives the aggregate status of a work item from its tasks.
   *
   * - Returns 'COMPLETED' if all tasks have status === 'completed'
   * - Returns 'PENDING' if all tasks have status === 'todo' OR if the array is empty
   * - Returns 'IN_PROGRESS' in all other cases (any mix, or any 'in-progress')
   *
   * Requirements: 6.5, 6.6, Property 2
   */
  derive(tasks: { status: string }[]): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' {
    if (tasks.length === 0) {
      return 'PENDING';
    }

    const allCompleted = tasks.every((t) => t.status === 'completed');
    if (allCompleted) {
      return 'COMPLETED';
    }

    const allTodo = tasks.every((t) => t.status === 'todo');
    if (allTodo) {
      return 'PENDING';
    }

    return 'IN_PROGRESS';
  }
}
