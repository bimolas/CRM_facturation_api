import { WorkflowHistory } from './workflow-history.entity.js';

export abstract class IWorkflowHistoryRepository {
  abstract findByWorkflow(workflowId: number): Promise<WorkflowHistory[]>;
  abstract save(entry: WorkflowHistory): Promise<WorkflowHistory>;
}
