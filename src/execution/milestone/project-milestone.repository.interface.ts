import { ProjectMilestone } from './project-milestone.entity.js';

export interface IProjectMilestoneRepository {
  save(milestone: ProjectMilestone): Promise<ProjectMilestone>;
  findByWorkflow(workflowId: number): Promise<ProjectMilestone[]>;
  findOne(id: number): Promise<ProjectMilestone | null>;
  remove(id: number): Promise<void>;
}
