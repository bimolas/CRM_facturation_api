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
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { ArticleService } from './article.service.js';
import { Article } from './article.entity.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { SystemRole } from '../../identity/enum/system-role.enum.js';
import { CreateArticleDto } from './dto/create-article.dto.js';
import { ArticleResponseDto, ErrorResponseDto } from '../../common/dto/response.dto.js';

@ApiTags('Articles')
@ApiBearerAuth()
@Controller('articles')
//@UseGuards(JwtAuthGuard, RolesGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all articles',
    description: 'Retrieve a list of all articles in the catalog',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles retrieved successfully',
    type: [Article],
    schema: {
      example: [
        {
          id: 1,
          name: 'Office Desk Chair',
          reference: 'CHAIR-001',
          unitPriceHT: 250.5,
          categoryId: 1,
          createdAt: '2026-05-18T10:30:00Z',
          updatedAt: '2026-05-18T10:30:00Z',
        },
        {
          id: 2,
          name: 'Standing Desk',
          reference: 'DESK-001',
          unitPriceHT: 500,
          categoryId: 1,
          createdAt: '2026-05-18T11:00:00Z',
          updatedAt: '2026-05-18T11:00:00Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
    type: ErrorResponseDto,
  })
  findAll(): Promise<Article[]> {
    return this.articleService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get article by ID',
    description: 'Retrieve a specific article by its ID',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Article ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Article retrieved successfully',
    type: Article,
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Article> {
    return this.articleService.findOne(id);
  }

  @Post()
  @Roles(SystemRole.COMPANY_USER, SystemRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Create a new article',
    description: 'Add a new article to the catalog',
  })
  @ApiBody({
    type: CreateArticleDto,
    description: 'Article details',
  })
  @ApiResponse({
    status: 201,
    description: 'Article created successfully',
    type: Article,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  create(@Body() dto: CreateArticleDto): Promise<Article> {
    return this.articleService.create(dto);
  }

  @Delete(':id')
  @Roles(SystemRole.COMPANY_USER, SystemRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Delete an article',
    description: 'Remove an article from the catalog',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Article ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Article deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.articleService.remove(id);
  }
}
