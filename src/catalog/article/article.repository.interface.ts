import { Article } from './article.entity.js';

export interface IArticleRepository {
  findAll(): Promise<Article[]>;
  findOne(id: number): Promise<Article | null>;
  save(article: Article): Promise<Article>;
  remove(id: number): Promise<void>;
}
