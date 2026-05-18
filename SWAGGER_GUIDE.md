# Swagger Documentation Guide for NestJS API

This guide explains how to add complete Swagger documentation with request and response parameters to all your API endpoints.

## What We've Done

✅ Installed `class-validator` and `class-transformer`  
✅ Updated `business-workflow.controller.ts` with full Swagger documentation  
✅ Updated `article.controller.ts` with full Swagger documentation  

## How to Apply to Other Controllers

### Step 1: Create DTO Files

For each controller, create a `dto` folder and DTOs with decorators:

```typescript
// src/path/to/controller/dto/create-example.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEmail } from 'class-validator';

export class CreateExampleDto {
  @ApiProperty({
    description: 'Clear description of the field',
    example: 'example value',
  })
  @IsString()
  fieldName: string;

  @ApiPropertyOptional({
    description: 'Optional field description',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  optionalField?: number;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
```

### Step 2: Import Swagger Decorators in Controller

```typescript
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
```

### Step 3: Decorate Controller Class

```typescript
@ApiTags('Resource Name')  // Group endpoints in Swagger UI
@ApiBearerAuth()           // Indicates JWT authentication required
@Controller('resource-path')
//@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourceController {
  // ...
}
```

### Step 4: Decorate Each Endpoint

#### GET Endpoint (List):
```typescript
@Get()
@ApiOperation({
  summary: 'Get all resources',
  description: 'Retrieve a complete list of resources',
})
@ApiResponse({
  status: 200,
  description: 'Resources retrieved successfully',
  type: [ResourceEntity],  // Array response
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
findAll(): Promise<ResourceEntity[]> {
  return this.resourceService.findAll();
}
```

#### GET Endpoint (By ID):
```typescript
@Get(':id')
@ApiOperation({
  summary: 'Get resource by ID',
  description: 'Retrieve a specific resource by its ID',
})
@ApiParam({
  name: 'id',
  type: 'number',
  description: 'Resource ID',
  example: 1,
})
@ApiResponse({
  status: 200,
  description: 'Resource retrieved successfully',
  type: ResourceEntity,
})
@ApiResponse({
  status: 404,
  description: 'Resource not found',
})
findOne(@Param('id', ParseIntPipe) id: number): Promise<ResourceEntity> {
  return this.resourceService.findOne(id);
}
```

#### POST Endpoint (Create):
```typescript
@Post()
@ApiOperation({
  summary: 'Create new resource',
  description: 'Add a new resource to the system',
})
@ApiBody({
  type: CreateResourceDto,
  description: 'Resource data',
})
@ApiResponse({
  status: 201,
  description: 'Resource created successfully',
  type: ResourceEntity,
})
@ApiResponse({
  status: 400,
  description: 'Invalid input data',
})
create(@Body() dto: CreateResourceDto): Promise<ResourceEntity> {
  return this.resourceService.create(dto);
}
```

#### DELETE Endpoint:
```typescript
@Delete(':id')
@ApiOperation({
  summary: 'Delete resource',
  description: 'Remove a resource from the system',
})
@ApiParam({
  name: 'id',
  type: 'number',
  description: 'Resource ID',
  example: 1,
})
@ApiResponse({
  status: 200,
  description: 'Resource deleted successfully',
})
@ApiResponse({
  status: 404,
  description: 'Resource not found',
})
remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
  return this.resourceService.remove(id);
}
```

## Supported Class-Validator Decorators

These decorators help document your DTO fields:

- `@IsString()` - String validation
- `@IsNumber()` - Number validation
- `@IsEmail()` - Email validation
- `@IsDateString()` - ISO date string validation
- `@IsBoolean()` - Boolean validation
- `@IsEnum()` - Enum validation
- `@IsArray()` - Array validation
- `@IsOptional()` - Marks field as optional
- `@Min(value)` - Minimum value
- `@Max(value)` - Maximum value
- `@MinLength(value)` - Minimum string length
- `@MaxLength(value)` - Maximum string length

## Swagger Response Types

### ApiProperty Options:
```typescript
@ApiProperty({
  description: 'Detailed field description',
  example: 'value',
  type: String,              // Explicit type
  isArray: true,            // Is array field
  enum: ['value1', 'value2'], // Enum values
  required: true,           // Field required
  default: 'default value', // Default value
})
```

### ApiResponse Status Codes:
- `200` - OK (GET, PUT, DELETE)
- `201` - Created (POST)
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Existing Examples in Your Project

### Article Controller
Location: `src/catalog/article/article.controller.ts`

✅ Fully documented with:
- DTO: `CreateArticleDto`
- All endpoints have `@ApiOperation` and `@ApiResponse`
- Parameters documented with `@ApiParam`
- Request body documented with `@ApiBody`

### Workflow Controller
Location: `src/marketplace/workflow/business-workflow.controller.ts`

✅ Fully documented with:
- Multiple DTOs: `CreateWorkflowDto`, `SubmitBidDto`, `AcceptBidDto`, `RecordTestOutcomeDto`
- All endpoints have comprehensive documentation
- Nested object support (BidItemDto within SubmitBidDto)

## Other Controllers to Document

Create DTOs and add Swagger decorators to:

1. **Category Controller** (`src/catalog/category/`)
2. **Auth Controller** (`src/auth/`)
3. **Invoice Controllers** (`src/finance/facture/`)
4. **Quote Controllers** (`src/finance/devis/`)
5. **Payment Controllers** (`src/finance/paiement/`)
6. **Purchase Order Controllers** (`src/finance/bon-de-commande/`)
7. **User Controller** (`src/identity/user/`)
8. **Company Controller** (`src/identity/company/`)
9. **Inventory Controller** (`src/execution/inventory/`)

## Viewing Your Swagger Documentation

After implementing these changes, visit:

```
http://localhost:3000/api
```

All endpoints will be fully documented with:
- ✅ Request parameters
- ✅ Request body structure
- ✅ Response format
- ✅ HTTP status codes
- ✅ Descriptions and examples

## Tips

1. **Always use DTOs**: Don't use interfaces for request bodies; use classes with decorators
2. **Be descriptive**: Provide clear descriptions and realistic examples
3. **Include all fields**: Document required and optional fields
4. **Use meaningful status codes**: Specify all possible responses
5. **Group by tags**: Use `@ApiTags()` to organize endpoints logically
6. **Keep it updated**: Update Swagger docs when you modify endpoints
