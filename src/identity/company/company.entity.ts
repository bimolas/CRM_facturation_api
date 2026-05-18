import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';

@Entity('companies')
@Unique(['ice'])
@Unique(['rc'])
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  ice: string;

  @Column({ length: 50 })
  rc: string;

  @Column({ length: 100 })
  taxIdentifier: string;

  @Column({ length: 255 })
  email: string;

  @Column({ type: 'text', nullable: true })
  physicalAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'logo_url' })
  logoUrl: string | null;

  @Column({ default: true })
  isActive: boolean;

  constructor(partial?: Partial<Company>) {
    Object.assign(this, partial);
  }
}
