import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';
import { Team } from '../../teams/team.entity.js';
import { Task } from '../task/task.entity.js';

@Entity('work_items')
export class WorkItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BusinessWorkflow, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: BusinessWorkflow;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['material', 'service', 'subscription'],
  })
  type: 'material' | 'service' | 'subscription';

  @Column({
    type: 'enum',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

  @ManyToOne(() => Team, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_team_id' })
  assignedTeam: Team | null;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, name: 'monthly_amount' })
  monthlyAmount: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Task, (task) => task.workItem)
  tasks: Task[];

  constructor(partial?: Partial<WorkItem>) {
    Object.assign(this, partial);
  }
}
