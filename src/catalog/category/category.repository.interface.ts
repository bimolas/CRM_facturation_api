import { Category } from './category.entity.js';

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findOne(id: number): Promise<Category | null>;
  save(category: Category): Promise<Category>;
  remove(id: number): Promise<void>;
}
