import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'tva_rate' })
  tvaRate: number;

  constructor(partial?: Partial<Category>) {
    Object.assign(this, partial);
  }
}
