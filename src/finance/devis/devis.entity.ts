import { ChildEntity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Document } from '../common/document.entity.js';
import { Company } from '../../identity/company/company.entity.js';

@ChildEntity('DEVIS')
export class Devis extends Document {
  @Column({ type: 'date', name: 'valid_until', nullable: true })
  validUntil: Date;

  @ManyToOne(() => Company, { nullable: true, eager: true })
  @JoinColumn({ name: 'bidding_seller_company_id' })
  biddingSeller: Company | null;

  @Column({ default: false, name: 'is_accepted' })
  isAccepted: boolean;

  @Column({ type: 'int', nullable: true, name: 'delivery_lead_time' })
  deliveryLeadTime: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'down_payment_percentage' })
  downPaymentPercentage: number;

  @Column({ type: 'int', nullable: true, name: 'balance_due_days' })
  balanceDueDays: number;

  @Column({ type: 'int', default: 1, name: 'revision_number' })
  revisionNumber: number;

  @Column({ type: 'text', nullable: true, name: 'vendor_notes' })
  vendorNotes: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'technical_proposal_file_url' })
  technicalProposalFileUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'financial_quote_file_url' })
  financialQuoteFileUrl: string | null;

  constructor(partial?: Partial<Devis>) {
    super();
    Object.assign(this, partial);
  }
}
