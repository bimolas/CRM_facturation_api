import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './article.service.js';
import { Article } from './article.entity.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { SystemRole } from '../../identity/enum/system-role.enum.js';

interface CreateArticleDto {
  name: string;
  reference: string;
  unitPriceHT: number;
  categoryId: number;
}

@Controller('articles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  findAll(): Promise<Article[]> {
    return this.articleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Article> {
    return this.articleService.findOne(id);
  }

  @Post()
  @Roles(SystemRole.COMPANY_USER, SystemRole.COMPANY_ADMIN)
  create(@Body() dto: CreateArticleDto): Promise<Article> {
    return this.articleService.create(dto);
  }

  @Delete(':id')
  @Roles(SystemRole.COMPANY_USER, SystemRole.COMPANY_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.articleService.remove(id);
  }
}
