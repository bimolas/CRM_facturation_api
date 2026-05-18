import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SystemRole } from '../enum/system-role.enum.js';
import { Company } from '../company/company.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: SystemRole,
    default: SystemRole.COMPANY_USER,
  })
  role: SystemRole;

  @ManyToOne(() => Company, { eager: true, nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  constructor(partial?: Partial<User>) {
    Object.assign(this, partial);
  }
}
