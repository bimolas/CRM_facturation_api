import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category/category.entity.js';
import { Article } from './article/article.entity.js';
import { CategoryService } from './category/category.service.js';
import { ArticleService } from './article/article.service.js';
import { CategoryController } from './category/category.controller.js';
import { ArticleController } from './article/article.controller.js';
import { TypeOrmCategoryRepository } from './category/typeorm-category.repository.js';
import { TypeOrmArticleRepository } from './article/typeorm-article.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Article])],
  controllers: [CategoryController, ArticleController],
  providers: [
    { provide: 'ICategoryRepository', useClass: TypeOrmCategoryRepository },
    { provide: 'IArticleRepository', useClass: TypeOrmArticleRepository },
    CategoryService,
    ArticleService,
  ],
  exports: ['IArticleRepository', 'ICategoryRepository', ArticleService, CategoryService],
})
export class CatalogModule {}
