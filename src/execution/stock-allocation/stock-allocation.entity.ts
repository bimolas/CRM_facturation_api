import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryItem } from '../inventory/inventory-item.entity.js';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';

@Entity('stock_allocations')
export class StockAllocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'quantity_allocated' })
  quantityAllocated: number;

  @Column({ default: false, name: 'is_dispatched' })
  isDispatched: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'carrier_name' })
  carrierName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'tracking_number' })
  trackingNumber: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'delivery_slip_url' })
  deliverySlipUrl: string | null;

  @Column({ type: 'date', nullable: true, name: 'estimated_shipping_date' })
  estimatedShippingDate: Date | null;

  @Column({ type: 'date', nullable: true, name: 'actual_delivery_date' })
  actualDeliveryDate: Date | null;

  @ManyToOne(() => InventoryItem, { nullable: false, eager: true })
  @JoinColumn({ name: 'target_item_id' })
  targetItem: InventoryItem;

  @ManyToOne(() => BusinessWorkflow, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: BusinessWorkflow;

  constructor(partial?: Partial<StockAllocation>) {
    Object.assign(this, partial);
  }
}
