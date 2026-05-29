import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../identity/user/user.entity.js';
import { Company } from '../identity/company/company.entity.js';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => Company, { eager: true, nullable: false })
  @JoinColumn({ name: 'sender_company_id' })
  senderCompany: Company;

  @ManyToOne(() => Company, { eager: true, nullable: false })
  @JoinColumn({ name: 'receiver_company_id' })
  receiverCompany: Company;

  constructor(partial?: Partial<Message>) {
    Object.assign(this, partial);
  }
}
