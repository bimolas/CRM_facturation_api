import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowHistory } from './workflow-history.entity.js';
import { IWorkflowHistoryRepository } from './workflow-history.repository.interface.js';

@Injectable()
export class TypeOrmWorkflowHistoryRepository extends IWorkflowHistoryRepository {
  constructor(
    @InjectRepository(WorkflowHistory)
    private readonly repo: Repository<WorkflowHistory>,
  ) {
    super();
  }

  findByWorkflow(workflowId: number): Promise<WorkflowHistory[]> {
    return this.repo.find({
      where: { workflow: { id: workflowId } },
      relations: ['actor', 'workflow'],
      order: { timestamp: 'DESC' },
    });
  }

  async save(entry: WorkflowHistory): Promise<WorkflowHistory> {
    return this.repo.save(entry);
  }
}
