import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity.js';
import { Article } from '../../catalog/article/article.entity.js';

@Entity('document_items')
export class DocumentItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, name: 'service_name' })
  serviceName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'unit_price_ht' })
  unitPriceHT: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'applied_tva_rate' })
  appliedTvaRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @ManyToOne(() => Article, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'article_id' })
  article: Article | null;

  @ManyToOne(() => Document, (doc) => doc.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  constructor(partial?: Partial<DocumentItem>) {
    Object.assign(this, partial);
  }
}
