import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../identity/company/company.entity.js';

@Entity('holidays')
export class Holiday {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Company, { nullable: false, eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  constructor(partial?: Partial<Holiday>) {
    Object.assign(this, partial);
  }
}
