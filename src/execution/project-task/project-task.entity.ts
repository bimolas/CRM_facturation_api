import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskStatus } from '../enum/task-status.enum.js';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';

@Entity('project_tasks')
export class ProjectTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, name: 'task_title' })
  taskTitle: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.BACKLOG,
    name: 'task_status',
  })
  taskStatus: TaskStatus;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'logged_hours' })
  loggedHours: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'milestone_name' })
  milestoneName: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'completion_percentage' })
  completionPercentage: number;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'progress_report_url' })
  progressReportUrl: string | null;

  @Column({ type: 'date', nullable: true, name: 'planned_start_date' })
  plannedStartDate: Date | null;

  @Column({ type: 'date', nullable: true, name: 'planned_end_date' })
  plannedEndDate: Date | null;

  @ManyToOne(() => BusinessWorkflow, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: BusinessWorkflow;

  constructor(partial?: Partial<ProjectTask>) {
    Object.assign(this, partial);
  }
}
