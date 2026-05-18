import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';

@Entity('project_milestones')
export class ProjectMilestone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'date', nullable: true })
  deadline: Date | null;

  @Column({ default: false, name: 'is_achieved' })
  isAchieved: boolean;

  @ManyToOne(() => BusinessWorkflow, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: BusinessWorkflow;

  constructor(partial?: Partial<ProjectMilestone>) {
    Object.assign(this, partial);
  }
}
