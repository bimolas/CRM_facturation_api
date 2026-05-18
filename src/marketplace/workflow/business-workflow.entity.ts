import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { WorkflowStatus } from '../enum/workflow-status.enum.js';
import { WorkflowState } from '../interfaces/workflow-state.interface.js';
import { DraftState } from '../states/draft.state.js';
import { PublishedState } from '../states/published.state.js';
import { EvaluationState } from '../states/evaluation.state.js';
import { ExecutionState } from '../states/execution.state.js';
import { TestingState } from '../states/testing.state.js';
import { InvoicedState } from '../states/invoiced.state.js';
import { Company } from '../../identity/company/company.entity.js';
import { Document } from '../../finance/common/document.entity.js';
import { Devis } from '../../finance/devis/devis.entity.js';

const STATE_MAP: Record<WorkflowStatus, () => WorkflowState> = {
  [WorkflowStatus.DRAFT]: () => new DraftState(),
  [WorkflowStatus.PUBLISHED]: () => new PublishedState(),
  [WorkflowStatus.EVALUATION]: () => new EvaluationState(),
  [WorkflowStatus.IN_PROGRESS]: () => new ExecutionState(),
  [WorkflowStatus.UNDER_TEST]: () => new TestingState(),
  [WorkflowStatus.FULLY_INVOICED]: () => new InvoicedState(),
};

@Entity('business_workflows')
export class BusinessWorkflow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetCeiling: number;

  @Column({ type: 'varchar', length: 255, name: 'technical_category', nullable: true })
  technicalCategory: string | null;

  @Column({ type: 'date', name: 'submission_deadline', nullable: true })
  submissionDeadline: Date | null;

  @Column({ type: 'date', name: 'expected_delivery_date', nullable: true })
  expectedDeliveryDate: Date | null;

  @Column({ type: 'varchar', length: 10, default: 'MAD' })
  currency: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'rfp_file_url' })
  rfpFileUrl: string | null;

  // ─── Phase 5: Test / Acceptation ──────────────────────────────────────────

  @Column({ default: false, name: 'is_accepted' })
  isAccepted: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'test_date' })
  testDate: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'tester_name' })
  testerName: string | null;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'pv_recette_file_url' })
  pvRecetteFileUrl: string | null;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.DRAFT,
    name: 'state_code',
  })
  stateCode: WorkflowStatus;

  @ManyToOne(() => Company, { nullable: false, eager: true })
  @JoinColumn({ name: 'buyer_company_id' })
  buyerCompany: Company;

  @ManyToOne(() => Company, { nullable: true, eager: true })
  @JoinColumn({ name: 'chosen_seller_company_id' })
  chosenSellerCompany: Company | null;

  @OneToMany(() => Document, (doc) => doc.workflow, { cascade: true })
  documents: Document[];

  @OneToMany(() => Devis, (d) => d.workflow, { cascade: true })
  bids: Devis[];

  // ─── Transient State Machine (not persisted) ──────────────────────────────
  private _currentState: WorkflowState;

  get currentState(): WorkflowState {
    if (!this._currentState) {
      this._currentState = STATE_MAP[this.stateCode ?? WorkflowStatus.DRAFT]();
    }
    return this._currentState;
  }

  constructor(partial?: Partial<BusinessWorkflow>) {
    Object.assign(this, partial);
  }

  // ─── State Transitions ────────────────────────────────────────────────────

  publish(): void {
    this.currentState.handlePublish();
    this.transitionTo(WorkflowStatus.PUBLISHED);
  }

  submitBid(bid: Devis): void {
    this.currentState.handleSubmitBid();
    if (!this.bids) this.bids = [];
    this.bids.push(bid);
    this.transitionTo(WorkflowStatus.EVALUATION);
  }

  acceptBid(bidId: number, seller: Company): void {
    const bid = this.bids?.find((b) => b.id === bidId);
    if (!bid) throw new Error(`Bid #${bidId} not found on workflow #${this.id}`);
    bid.isAccepted = true;
    this.chosenSellerCompany = seller;
    this.currentState.handleAcceptBid();
    this.transitionTo(WorkflowStatus.IN_PROGRESS);
  }

  completeAndTest(): void {
    this.currentState.handleComplete();
    this.transitionTo(WorkflowStatus.UNDER_TEST);
  }

  rejectTest(reason: string): void {
    if (this.stateCode !== WorkflowStatus.UNDER_TEST) {
      throw new Error(`Cannot reject test in state ${this.stateCode}`);
    }
    this.isAccepted = false;
    this.rejectionReason = reason;
    this.transitionTo(WorkflowStatus.IN_PROGRESS);
  }

  fullyInvoice(): void {
    this.currentState.handleComplete();
    this.transitionTo(WorkflowStatus.FULLY_INVOICED);
  }

  private transitionTo(status: WorkflowStatus): void {
    this.stateCode = status;
    this._currentState = STATE_MAP[status]();
  }
}
