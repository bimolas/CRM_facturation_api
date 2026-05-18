import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Company } from '../../identity/company/company.entity.js';

@Entity('inventory_items')
@Unique(['vendorCompany', 'stockKeepingUnit'])
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, name: 'stock_keeping_unit' })
  stockKeepingUnit: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0, name: 'available_stock' })
  availableStock: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'base_unit_cost' })
  baseUnitCost: number;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_company_id' })
  vendorCompany: Company;

  constructor(partial?: Partial<InventoryItem>) {
    Object.assign(this, partial);
  }
}
