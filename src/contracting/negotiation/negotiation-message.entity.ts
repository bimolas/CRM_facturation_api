import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Devis } from '../../finance/devis/devis.entity.js';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';
import { Company } from '../../identity/company/company.entity.js';
import { User } from '../../identity/user/user.entity.js';

export enum NegotiationMessageType {
  BUYER_MESSAGE = 'BUYER_MESSAGE',
  VENDOR_MESSAGE = 'VENDOR_MESSAGE',
  SYSTEM_NOTE = 'SYSTEM_NOTE',
}

@Entity('negotiation_messages')
export class NegotiationMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Devis, { nullable: false, onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'bid_id' })
  bid: Devis;

  @ManyToOne(() => BusinessWorkflow, { nullable: false, onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'workflow_id' })
  workflow: BusinessWorkflow;

  @ManyToOne(() => Company, { nullable: false, eager: true })
  @JoinColumn({ name: 'sender_company_id' })
  senderCompany: Company;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'sender_user_id' })
  senderUser: User;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: NegotiationMessageType,
    name: 'message_type',
  })
  messageType: NegotiationMessageType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(partial?: Partial<NegotiationMessage>) {
    Object.assign(this, partial);
  }
}
