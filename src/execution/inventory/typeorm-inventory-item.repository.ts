import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './inventory-item.entity.js';
import { IInventoryItemRepository } from './inventory-item.repository.interface.js';

@Injectable()
export class TypeOrmInventoryItemRepository extends IInventoryItemRepository {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly repo: Repository<InventoryItem>,
  ) {
    super();
  }

  findAll(): Promise<InventoryItem[]> {
    return this.repo.find();
  }

  findOne(id: number): Promise<InventoryItem | null> {
    return this.repo.findOneBy({ id });
  }

  findBySku(sku: string): Promise<InventoryItem | null> {
    return this.repo.findOneBy({ stockKeepingUnit: sku });
  }

  findBySkuAndVendor(sku: string, vendorId: number): Promise<InventoryItem | null> {
    return this.repo.findOne({ where: { stockKeepingUnit: sku, vendorCompany: { id: vendorId } } });
  }

  async save(item: InventoryItem): Promise<InventoryItem> {
    return this.repo.save(item);
  }

  async remove(item: InventoryItem): Promise<void> {
    await this.repo.remove(item);
  }
}
