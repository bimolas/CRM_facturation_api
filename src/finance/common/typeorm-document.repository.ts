import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity.js';
import { IDocumentRepository } from './document.repository.interface.js';

@Injectable()
export class TypeOrmDocumentRepository extends IDocumentRepository {
  constructor(
    @InjectRepository(Document)
    private readonly repo: Repository<Document>,
  ) {
    super();
  }

  findAll(): Promise<Document[]> {
    return this.repo.find({ relations: ['items', 'workflow'] });
  }

  findOne(id: number): Promise<Document | null> {
    return this.repo.findOne({ where: { id }, relations: ['items', 'workflow'] });
  }

  findByWorkflow(workflowId: number): Promise<Document[]> {
    return this.repo.find({
      where: { workflow: { id: workflowId } },
      relations: ['items'],
    });
  }

  async save(doc: Document): Promise<Document> {
    return this.repo.save(doc);
  }

  async remove(doc: Document): Promise<void> {
    await this.repo.remove(doc);
  }
}
