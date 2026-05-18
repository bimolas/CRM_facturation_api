import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO - Shows what the API returns
 * This helps Swagger document the response structure
 */
export class WorkflowResponseDto {
  @ApiProperty({
    description: 'Unique workflow identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Workflow title',
    example: 'Supply Request for Office Equipment',
  })
  title: string;

  @ApiProperty({
    description: 'Workflow description',
    example: 'Request for quotes on office equipment',
  })
  description: string;

  @ApiProperty({
    description: 'Current workflow status',
    example: 'PUBLISHED',
    enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'COMPLETED'],
  })
  status: string;

  @ApiProperty({
    description: 'Maximum budget',
    example: 50000,
  })
  budgetCeiling: number;

  @ApiProperty({
    description: 'Buyer company ID',
    example: 1,
  })
  buyerCompanyId: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-05-18T10:30:00Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-05-18T14:45:00Z',
    type: Date,
  })
  updatedAt: Date;
}

export class ArticleResponseDto {
  @ApiProperty({
    description: 'Unique article identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Article name',
    example: 'Office Desk Chair',
  })
  name: string;

  @ApiProperty({
    description: 'Article reference code',
    example: 'CHAIR-001',
  })
  reference: string;

  @ApiProperty({
    description: 'Unit price excluding taxes',
    example: 250.5,
  })
  unitPriceHT: number;

  @ApiProperty({
    description: 'Category ID',
    example: 1,
  })
  categoryId: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-05-18T10:30:00Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-05-18T14:45:00Z',
    type: Date,
  })
  updatedAt: Date;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid input data',
  })
  message: string;

  @ApiProperty({
    description: 'Error details',
    example: {
      field: ['Validation error message'],
    },
  })
  error: Record<string, string[]>;
}
