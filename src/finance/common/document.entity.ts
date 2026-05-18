import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  TableInheritance,
} from 'typeorm';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';
import { DocumentItem } from './document-item.entity.js';

/**
 * Single Table Inheritance parent.
 * All financial documents (Devis, BonDeCommande, Facture) share this table.
 * The `document_type` discriminator column differentiates child rows.
 */
@Entity('financial_documents')
@TableInheritance({ column: { type: 'varchar', name: 'document_type' } })
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true, name: 'reference_number' })
  referenceNumber: string;

  @Column({ type: 'date', name: 'issue_date' })
  issueDate: Date;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'sub_total_ht',
  })
  subTotalHT: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'total_tva',
  })
  totalTVA: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'total_ttc',
  })
  totalTTC: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'global_discount_percentage' })
  globalDiscountPercentage: number;

  @Column({ type: 'date', nullable: true, name: 'annual_archiving_date' })
  annualArchivingDate: Date | null;

  /** Optional nullable path to a signed/system-generated PDF. */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'file_path' })
  filePath: string | null;

  @ManyToOne(() => BusinessWorkflow, (wf) => wf.documents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'workflow_id' })
  workflow: BusinessWorkflow | null;

  @OneToMany(() => DocumentItem, (item) => item.document, {
    cascade: true,
    eager: true,
  })
  items: DocumentItem[];

  constructor(partial?: Partial<Document>) {
    Object.assign(this, partial);
  }
}
