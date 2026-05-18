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
import { CategoryService } from './category.service.js';
import { Category } from './category.entity.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { SystemRole } from '../../identity/enum/system-role.enum.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Retrieve a list of all product categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [Category],
    schema: {
      example: [
        {
          id: 1,
          name: 'Office Equipment',
          tvaRate: 20,
          createdAt: '2026-05-18T10:30:00Z',
          updatedAt: '2026-05-18T10:30:00Z',
        },
      ],
    },
  })
  findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieve a specific category by its ID',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Category ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoryService.findOne(id);
  }

  @Post()
  //@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Add a new product category (admin only)',
  })
  @ApiBody({
    type: CreateCategoryDto,
    description: 'Category details',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: Category,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT required',
  })
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.create(dto);
  }

  @Delete(':id')
  //@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a category',
    description: 'Remove a category from the system (admin only)',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Category ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT required',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoryService.remove(id);
  }
}
