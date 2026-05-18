import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity.js';
import { IArticleRepository } from './article.repository.interface.js';

@Injectable()
export class TypeOrmArticleRepository implements IArticleRepository {
  constructor(
    @InjectRepository(Article)
    private readonly repo: Repository<Article>,
  ) {}

  findAll(): Promise<Article[]> {
    return this.repo.find();
  }

  findOne(id: number): Promise<Article | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(article: Article): Promise<Article> {
    return this.repo.save(article);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
