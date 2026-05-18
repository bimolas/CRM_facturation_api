import { BusinessWorkflow } from './business-workflow.entity.js';

export abstract class IBusinessWorkflowRepository {
  abstract findAll(): Promise<BusinessWorkflow[]>;
  abstract findOne(id: number): Promise<BusinessWorkflow | null>;
  abstract findByBuyerCompany(companyId: number): Promise<BusinessWorkflow[]>;
  abstract findBySellerCompany(companyId: number): Promise<BusinessWorkflow[]>;
  abstract save(workflow: BusinessWorkflow): Promise<BusinessWorkflow>;
  abstract remove(workflow: BusinessWorkflow): Promise<void>;
}
