import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { SystemRole } from '../../enum/system-role.enum.js';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@company.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (will be hashed)',
    example: 'SecurePassword123!',
  })
  @IsString()
  passwordHash: string;

  @ApiProperty({
    description: 'User role',
    enum: ['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER'],
    example: 'COMPANY_USER',
  })
  @IsEnum(SystemRole)
  role: SystemRole;

  @ApiProperty({
    description: 'Company ID this user belongs to',
    example: 1,
  })
  @IsNumber()
  companyId: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'New email address',
    example: 'newemail@company.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'New role',
    enum: ['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'COMPANY_USER'],
    example: 'COMPANY_ADMIN',
  })
  @IsOptional()
  @IsEnum(SystemRole)
  role?: SystemRole;

  @ApiPropertyOptional({
    description: 'New company ID',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  companyId?: number;
}
