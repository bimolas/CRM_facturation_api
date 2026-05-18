import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryItem } from './inventory-item.entity.js';
import { IInventoryItemRepository } from './inventory-item.repository.interface.js';
import { Company } from '../../identity/company/company.entity.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';

interface CreateInventoryItemDto {
  vendorCompanyId?: number;
  stockKeepingUnit: string;
  description?: string;
  availableStock: number;
  baseUnitCost: number;
}

@Controller('inventory')
//@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    @Inject('IInventoryItemRepository')
    private readonly inventoryRepo: IInventoryItemRepository,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  findAll(@CurrentUser() user: any): Promise<InventoryItem[]> {
    if (user.role === 'PLATFORM_ADMIN') {
      return this.inventoryRepo.findAll();
    }
    return this.dataSource.getRepository(InventoryItem).find({
      where: { vendorCompany: { id: user.companyId } },
    });
  }

  @Post()
  async create(
    @Body() dto: CreateInventoryItemDto,
    @CurrentUser() user: any,
  ): Promise<InventoryItem> {
    const vendorCompanyId =
      user.role === 'PLATFORM_ADMIN'
        ? (dto.vendorCompanyId ?? user.companyId)
        : user.companyId;

    if (!vendorCompanyId) {
      throw new Error(`Vendor company ID is required`);
    }

    const company = await this.dataSource
      .getRepository(Company)
      .findOneBy({ id: vendorCompanyId });
    if (!company) {
      throw new Error(`Company with ID ${vendorCompanyId} not found`);
    }

    // Check if item already exists for this vendor and sku, if so, update stock
    let item = await this.inventoryRepo.findBySkuAndVendor(
      dto.stockKeepingUnit,
      vendorCompanyId,
    );
    if (item) {
      item.availableStock = dto.availableStock;
      item.description = dto.description ?? item.description;
      item.baseUnitCost = dto.baseUnitCost;
    } else {
      item = new InventoryItem({
        stockKeepingUnit: dto.stockKeepingUnit,
        description: dto.description,
        availableStock: dto.availableStock,
        baseUnitCost: dto.baseUnitCost,
        vendorCompany: company,
      });
    }

    return this.inventoryRepo.save(item);
  }
}
