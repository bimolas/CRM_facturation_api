import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity.js';
import { ICategoryRepository } from './category.repository.interface.js';

@Injectable()
export class TypeOrmCategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.repo.find();
  }

  findOne(id: number): Promise<Category | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(category: Category): Promise<Category> {
    return this.repo.save(category);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
