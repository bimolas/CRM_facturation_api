import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTask } from './project-task.entity.js';
import { IProjectTaskRepository } from './project-task.repository.interface.js';

@Injectable()
export class TypeOrmProjectTaskRepository extends IProjectTaskRepository {
  constructor(
    @InjectRepository(ProjectTask)
    private readonly repo: Repository<ProjectTask>,
  ) {
    super();
  }

  findByWorkflow(workflowId: number): Promise<ProjectTask[]> {
    return this.repo.find({ where: { workflow: { id: workflowId } } });
  }

  findOne(id: number): Promise<ProjectTask | null> {
    return this.repo.findOneBy({ id });
  }

  async save(task: ProjectTask): Promise<ProjectTask> {
    return this.repo.save(task);
  }

  async remove(task: ProjectTask): Promise<void> {
    await this.repo.remove(task);
  }
}
