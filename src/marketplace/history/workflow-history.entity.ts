import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { WorkflowStatus } from '../enum/workflow-status.enum.js';
import { BusinessWorkflow } from '../workflow/business-workflow.entity.js';
import { User } from '../../identity/user/user.entity.js';

@Entity('workflow_histories')
export class WorkflowHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    name: 'standard_status',
  })
  standardStatus: WorkflowStatus;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => BusinessWorkflow, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: BusinessWorkflow;

  @ManyToOne(() => User, { nullable: false, eager: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  constructor(partial?: Partial<WorkflowHistory>) {
    Object.assign(this, partial);
  }
}
