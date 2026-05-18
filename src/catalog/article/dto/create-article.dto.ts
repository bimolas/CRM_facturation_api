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
    example: 250.50,
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
