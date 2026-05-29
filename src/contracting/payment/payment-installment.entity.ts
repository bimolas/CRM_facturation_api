import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkItem } from '../work-item/work-item.entity.js';

@Entity('payment_installments')
export class PaymentInstallment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkItem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_item_id' })
  workItem: WorkItem;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'PAID', 'OVERDUE'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'PAID' | 'OVERDUE';

  @Column({ type: 'datetime', nullable: true, name: 'paid_at' })
  paidAt: Date | null;

  constructor(partial?: Partial<PaymentInstallment>) {
    Object.assign(this, partial);
  }
}
