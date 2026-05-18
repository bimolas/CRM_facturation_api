import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Authenticated user information',
    example: {
      id: 1,
      email: 'user@example.com',
      role: 'COMPANY_USER',
      companyId: 1,
    },
  })
  user: {
    id: number;
    email: string;
    role: string;
    companyId: number;
  };
}

export class RegisterRequestDto {
  @ApiProperty({
    description: 'Company information for registration',
    example: {
      name: 'Acme Corp',
      ice: '123456789',
      rc: '987654321',
      taxIdentifier: 'TAX-123456789',
      email: 'contact@acme.com',
      physicalAddress: '123 Main St',
    },
  })
  company: {
    name: string;
    ice: string;
    rc: string;
    taxIdentifier: string;
    email: string;
    physicalAddress?: string;
  };

  @ApiProperty({
    description: 'Admin user information for registration',
    example: {
      email: 'admin@acme.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
    },
  })
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Registration success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Company and admin user created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Created company ID',
    example: 1,
  })
  companyId: number;

  @ApiProperty({
    description: 'Created user ID',
    example: 1,
  })
  userId: number;
}
