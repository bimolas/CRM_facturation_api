import { InventoryItem } from './inventory-item.entity.js';

export abstract class IInventoryItemRepository {
  abstract findAll(): Promise<InventoryItem[]>;
  abstract findOne(id: number): Promise<InventoryItem | null>;
  abstract findBySku(sku: string): Promise<InventoryItem | null>;
  abstract findBySkuAndVendor(sku: string, vendorId: number): Promise<InventoryItem | null>;
  abstract save(item: InventoryItem): Promise<InventoryItem>;
  abstract remove(item: InventoryItem): Promise<void>;
}
