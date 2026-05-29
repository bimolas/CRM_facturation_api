import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkItem } from '../contracting/work-item/work-item.entity.js';
import { BusinessWorkflow } from '../marketplace/workflow/business-workflow.entity.js';

@Entity('calendar_events')
export class CalendarEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkItem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_item_id' })
  workItem: WorkItem;

  @ManyToOne(() => BusinessWorkflow, { nullable: false })
  @JoinColumn({ name: 'workflow_id' })
  workflow: BusinessWorkflow;

  @Column({
    type: 'enum',
    enum: ['PACKAGING', 'DEPARTURE', 'ARRIVAL', 'SERVICE_DAY', 'BILLING_CYCLE'],
    name: 'event_type',
  })
  eventType: 'PACKAGING' | 'DEPARTURE' | 'ARRIVAL' | 'SERVICE_DAY' | 'BILLING_CYCLE';

  @Column({ type: 'date', name: 'event_date' })
  eventDate: string;

  @Column({ default: false, name: 'has_conflict' })
  hasConflict: boolean;

  @Column({ type: 'simple-array', nullable: true, name: 'conflicting_work_item_ids' })
  conflictingWorkItemIds: number[] | null;

  constructor(partial?: Partial<CalendarEvent>) {
    Object.assign(this, partial);
  }
}
