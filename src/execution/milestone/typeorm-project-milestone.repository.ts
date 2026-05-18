import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMilestone } from './project-milestone.entity.js';
import { IProjectMilestoneRepository } from './project-milestone.repository.interface.js';

@Injectable()
export class TypeOrmProjectMilestoneRepository implements IProjectMilestoneRepository {
  constructor(
    @InjectRepository(ProjectMilestone)
    private readonly repo: Repository<ProjectMilestone>,
  ) {}

  save(milestone: ProjectMilestone): Promise<ProjectMilestone> {
    return this.repo.save(milestone);
  }

  findByWorkflow(workflowId: number): Promise<ProjectMilestone[]> {
    return this.repo.find({
      where: { workflow: { id: workflowId } },
      order: { deadline: 'ASC' },
    });
  }

  findOne(id: number): Promise<ProjectMilestone | null> {
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
