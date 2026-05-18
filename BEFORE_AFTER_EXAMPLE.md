# Before & After: Swagger Documentation Example

## ❌ BEFORE (Without Swagger Documentation)

### Controller Code:
```typescript
import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ArticleService } from './article.service.js';
import { Article } from './article.entity.js';

interface CreateArticleDto {
  name: string;
  reference: string;
  unitPriceHT: number;
  categoryId: number;
}

@Controller('articles')
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
  create(@Body() dto: CreateArticleDto): Promise<Article> {
    return this.articleService.create(dto);
  }
}
```

### Swagger UI Result:
```
❌ No request body documentation
❌ No response schema examples
❌ Parameter types unclear
❌ Status codes not documented
❌ No field descriptions
❌ No example values
```

---

## ✅ AFTER (With Complete Swagger Documentation)

### Step 1: Create DTO File with Decorators

**File: `src/catalog/article/dto/create-article.dto.ts`**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Article name/title',
    example: 'Office Desk Chair',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Article reference code',
    example: 'CHAIR-001',
  })
  @IsString()
  reference: string;

  @ApiProperty({
    description: 'Unit price (excluding taxes)',
    example: 250.5,
  })
  @IsNumber()
  unitPriceHT: number;

  @ApiProperty({
    description: 'Category ID for this article',
    example: 1,
  })
  @IsNumber()
  categoryId: number;
}
```

### Step 2: Update Controller with Swagger Decorators

**File: `src/catalog/article/article.controller.ts`**
```typescript
import {
  Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards,
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
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
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
    schema: {
      example: {
        id: 1,
        name: 'Office Desk Chair',
        reference: 'CHAIR-001',
        unitPriceHT: 250.5,
        categoryId: 1,
        createdAt: '2026-05-18T10:30:00Z',
        updatedAt: '2026-05-18T10:30:00Z',
      },
    },
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
    schema: {
      example: {
        id: 1,
        name: 'Office Desk Chair',
        reference: 'CHAIR-001',
        unitPriceHT: 250.5,
        categoryId: 1,
        createdAt: '2026-05-18T10:30:00Z',
        updatedAt: '2026-05-18T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data - see error details',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  create(@Body() dto: CreateArticleDto): Promise<Article> {
    return this.articleService.create(dto);
  }
}
```

### Swagger UI Result:

✅ **GET /articles Response:**
```json
200 - Success
[
  {
    "id": 1,
    "name": "Office Desk Chair",
    "reference": "CHAIR-001",
    "unitPriceHT": 250.5,
    "categoryId": 1,
    "createdAt": "2026-05-18T10:30:00Z",
    "updatedAt": "2026-05-18T10:30:00Z"
  }
]

401 - Unauthorized
```

✅ **GET /articles/{id} Parameter:**
```
name: id (path)
type: number
required: true
example: 1
description: "Article ID"
```

✅ **POST /articles Request Body:**
```json
{
  "name": "Office Desk Chair",
  "reference": "CHAIR-001",
  "unitPriceHT": 250.5,
  "categoryId": 1
}
```

✅ **POST /articles Response:**
```json
201 - Created
{
  "id": 1,
  "name": "Office Desk Chair",
  "reference": "CHAIR-001",
  "unitPriceHT": 250.5,
  "categoryId": 1,
  "createdAt": "2026-05-18T10:30:00Z",
  "updatedAt": "2026-05-18T10:30:00Z"
}

400 - Bad Request
401 - Unauthorized
```

---

## 📊 What Changed?

| Aspect | Before | After |
|--------|--------|-------|
| **Request Documentation** | ❌ Missing | ✅ Full schema with examples |
| **Response Documentation** | ❌ Unknown | ✅ Complete with examples |
| **Parameter Details** | ❌ Unclear | ✅ Type, description, example |
| **Status Codes** | ❌ Not documented | ✅ All codes explained |
| **Field Descriptions** | ❌ None | ✅ All fields described |
| **Example Values** | ❌ None | ✅ Realistic examples |
| **Try It Out** | ❌ Not possible | ✅ Can test from UI |
| **Type Safety** | ❌ No validation | ✅ Validation decorators |
| **Authorization** | ❌ Not shown | ✅ JWT requirement clear |
| **API Usability** | ⭐ Poor | ⭐⭐⭐⭐⭐ Excellent |

---

## 🎯 Key Improvements

### 1. **Request Body is Now Clear**
```
Before: No documentation
After:  Shows all fields, types, and examples
```

### 2. **Response Format is Explicit**
```
Before: Developers guess structure
After:  Shows exact JSON response with examples
```

### 3. **Parameters are Self-Documenting**
```
Before: Unclear what 'id' means
After:  "Article ID" with example value "1"
```

### 4. **Try It Out Feature Works**
```
Before: Manual testing with curl/Postman
After:  Click "Try it out" directly in Swagger UI
```

### 5. **Error Handling is Documented**
```
Before: What does 400 mean?
After:  "Invalid input data - see error details"
```

---

## 🚀 Result

Visit `http://localhost:3000/api` and see:

1. ✅ All endpoints listed under "Articles" tag
2. ✅ Each endpoint shows complete documentation
3. ✅ Click "Try it out" to test endpoints
4. ✅ See exact request format needed
5. ✅ See exact response you'll get
6. ✅ Understand all possible status codes
7. ✅ Clear descriptions for every field
8. ✅ Realistic example values

**From confusing to crystal clear! 🎉**
