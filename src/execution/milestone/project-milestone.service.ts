import { Injectable, Inject } from '@nestjs/common';
import { ProjectMilestone } from './project-milestone.entity.js';
import type { IProjectMilestoneRepository } from './project-milestone.repository.interface.js';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';

@Injectable()
export class ProjectMilestoneService {
  constructor(
    @Inject('IProjectMilestoneRepository')
    private readonly milestoneRepo: IProjectMilestoneRepository,
  ) {}

  async createMilestone(title: string, deadline: Date | null, workflow: BusinessWorkflow): Promise<ProjectMilestone> {
    const milestone = new ProjectMilestone({
      title,
      deadline,
      workflow,
      isAchieved: false,
    });
    return this.milestoneRepo.save(milestone);
  }

  findByWorkflow(workflowId: number): Promise<ProjectMilestone[]> {
    return this.milestoneRepo.findByWorkflow(workflowId);
  }

  async achieveMilestone(id: number): Promise<ProjectMilestone> {
    const milestone = await this.milestoneRepo.findOne(id);
    if (!milestone) throw new Error(`Milestone #${id} not found`);
    milestone.isAchieved = true;
    return this.milestoneRepo.save(milestone);
  }
}
