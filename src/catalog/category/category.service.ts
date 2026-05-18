import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Category } from './category.entity.js';
import type { ICategoryRepository } from './category.repository.interface.js';

@Injectable()
export class CategoryService {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepo.findAll();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOne(id);
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  create(data: { name: string; tvaRate: number }): Promise<Category> {
    const category = new Category(data);
    return this.categoryRepo.save(category);
  }

  async remove(id: number): Promise<void> {
    await this.categoryRepo.remove(id);
  }
}
