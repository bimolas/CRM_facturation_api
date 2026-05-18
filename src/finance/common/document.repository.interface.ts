import { Document } from './document.entity.js';

export abstract class IDocumentRepository {
  abstract findAll(): Promise<Document[]>;
  abstract findOne(id: number): Promise<Document | null>;
  abstract findByWorkflow(workflowId: number): Promise<Document[]>;
  abstract save(doc: Document): Promise<Document>;
  abstract remove(doc: Document): Promise<void>;
}
