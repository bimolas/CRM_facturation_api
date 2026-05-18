import { ProjectExecutionStrategy } from './project-execution.strategy.js';
import { ProjectTask } from '../project-task/project-task.entity.js';
import { TaskStatus } from '../enum/task-status.enum.js';

export class ImmaterialProjectStrategy implements ProjectExecutionStrategy {
  tasks: ProjectTask[] = [];
  codeRepositoryUrl: string = '';

  initializeWorkspace(): void {
    console.log('[ImmaterialProjectStrategy] Workspace initialized — task board cleared.');
    this.tasks = [];
  }

  processFulfillmentUpdate(updatePayload: Record<string, unknown>): void {
    const taskId = updatePayload['taskId'] as number;
    const newStatus = updatePayload['status'] as TaskStatus;
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.taskStatus = newStatus;
      console.log(`[ImmaterialProjectStrategy] Task #${taskId} → ${newStatus}`);
    } else {
      console.warn(`[ImmaterialProjectStrategy] Task #${taskId} not found.`);
    }
  }

  getCompletionPercentage(): number {
    if (this.tasks.length === 0) return 0;
    const completed = this.tasks.filter((t) => t.taskStatus === TaskStatus.COMPLETED).length;
    return Math.round((completed / this.tasks.length) * 100);
  }

  verifyReadyForClientTesting(): boolean {
    const allComplete = this.tasks.every((t) => t.taskStatus === TaskStatus.COMPLETED);
    console.log(`[ImmaterialProjectStrategy] Ready for client testing: ${allComplete}`);
    return allComplete;
  }
}
