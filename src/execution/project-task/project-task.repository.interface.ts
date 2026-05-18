import { ProjectTask } from './project-task.entity.js';

export abstract class IProjectTaskRepository {
  abstract findByWorkflow(workflowId: number): Promise<ProjectTask[]>;
  abstract findOne(id: number): Promise<ProjectTask | null>;
  abstract save(task: ProjectTask): Promise<ProjectTask>;
  abstract remove(task: ProjectTask): Promise<void>;
}
