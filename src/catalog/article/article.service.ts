import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Article } from './article.entity.js';
import type { IArticleRepository } from './article.repository.interface.js';
import { CategoryService } from '../category/category.service.js';

@Injectable()
export class ArticleService {
  constructor(
    @Inject('IArticleRepository')
    private readonly articleRepo: IArticleRepository,
    private readonly categoryService: CategoryService,
  ) {}

  findAll(): Promise<Article[]> {
    return this.articleRepo.findAll();
  }

  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepo.findOne(id);
    if (!article) throw new NotFoundException(`Article #${id} not found`);
    return article;
  }

  async create(data: { name: string; reference: string; unitPriceHT: number; categoryId: number }): Promise<Article> {
    const category = await this.categoryService.findOne(data.categoryId);
    const article = new Article({
      name: data.name,
      reference: data.reference,
      unitPriceHT: data.unitPriceHT,
      category,
    });
    return this.articleRepo.save(article);
  }

  async remove(id: number): Promise<void> {
    await this.articleRepo.remove(id);
  }
}
