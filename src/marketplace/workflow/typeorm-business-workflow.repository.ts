import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessWorkflow } from './business-workflow.entity.js';
import { IBusinessWorkflowRepository } from './business-workflow.repository.interface.js';

const RELATIONS = [
  'buyerCompany',
  'chosenSellerCompany',
  'bids',
  'bids.biddingSeller',
  'bids.items',
  'bids.items.article',
  'documents',
  'documents.items',
];

@Injectable()
export class TypeOrmBusinessWorkflowRepository extends IBusinessWorkflowRepository {
  constructor(
    @InjectRepository(BusinessWorkflow)
    private readonly repo: Repository<BusinessWorkflow>,
  ) {
    super();
  }

  findAll(): Promise<BusinessWorkflow[]> {
    return this.repo.find({ relations: RELATIONS });
  }

  findOne(id: number): Promise<BusinessWorkflow | null> {
    return this.repo.findOne({ where: { id }, relations: RELATIONS });
  }

  findByBuyerCompany(companyId: number): Promise<BusinessWorkflow[]> {
    return this.repo.find({
      where: { buyerCompany: { id: companyId } },
      relations: RELATIONS,
    });
  }

  findBySellerCompany(companyId: number): Promise<BusinessWorkflow[]> {
    return this.repo.find({
      where: { chosenSellerCompany: { id: companyId } },
      relations: RELATIONS,
    });
  }

  async save(workflow: BusinessWorkflow): Promise<BusinessWorkflow> {
    return this.repo.save(workflow);
  }

  async remove(workflow: BusinessWorkflow): Promise<void> {
    await this.repo.remove(workflow);
  }
}
