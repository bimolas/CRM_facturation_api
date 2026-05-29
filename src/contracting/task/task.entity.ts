import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { WorkItem } from '../work-item/work-item.entity.js';
import { User } from '../../identity/user/user.entity.js';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkItem, (workItem) => workItem.tasks, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_item_id' })
  workItem: WorkItem;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo',
  })
  status: 'todo' | 'in-progress' | 'completed';

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_user_id' })
  assigneeUser: User | null;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate: Date | null;

  @Column({ type: 'int', default: 1, name: 'duration_days' })
  durationDays: number;

  @Column({ type: 'json', nullable: true })
  comments: object[];

  @Column({ type: 'json', nullable: true })
  attachments: object[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(partial?: Partial<Task>) {
    Object.assign(this, partial);
  }
}
