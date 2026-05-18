import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../category/category.entity.js';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  reference: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'unit_price_ht' })
  unitPriceHT: number;

  @ManyToOne(() => Category, { nullable: false, eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  constructor(partial?: Partial<Article>) {
    Object.assign(this, partial);
  }
}
