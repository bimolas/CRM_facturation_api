import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company legal name',
    example: 'Acme Corporation',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ICE number (Morocco identification)',
    example: '123456789',
  })
  @IsString()
  ice: string;

  @ApiProperty({
    description: 'RC number (Morocco registration certificate)',
    example: '987654321',
  })
  @IsString()
  rc: string;

  @ApiProperty({
    description: 'Tax identifier number',
    example: 'TAX-123456789',
  })
  @IsString()
  taxIdentifier: string;

  @ApiProperty({
    description: 'Company email address',
    example: 'contact@acme.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Company physical address',
    example: '123 Main Street, Suite 100',
  })
  @IsOptional()
  @IsString()
  physicalAddress?: string;

  @ApiPropertyOptional({
    description: 'Company logo URL',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the company is active',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description: 'Updated company name',
    example: 'Acme Corporation Ltd',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated ICE number',
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  ice?: string;

  @ApiPropertyOptional({
    description: 'Updated RC number',
    example: '987654321',
  })
  @IsOptional()
  @IsString()
  rc?: string;

  @ApiPropertyOptional({
    description: 'Updated tax identifier',
    example: 'TAX-987654321',
  })
  @IsOptional()
  @IsString()
  taxIdentifier?: string;

  @ApiPropertyOptional({
    description: 'Updated email address',
    example: 'newemail@acme.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Updated physical address',
    example: '456 Oak Avenue',
  })
  @IsOptional()
  @IsString()
  physicalAddress?: string;

  @ApiPropertyOptional({
    description: 'Updated logo URL',
    example: 'https://example.com/new-logo.png',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;
}
