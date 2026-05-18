import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import {
  IdentityService,
  CompanyDto,
  AdminUserDto,
} from '../identity/identity.service.js';
import { LoginDto, LoginResponseDto, RegisterRequestDto, RegisterResponseDto } from './dto/auth.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly identityService: IdentityService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new company and admin user',
    description: 'Create a new company with an initial admin user account',
  })
  @ApiBody({
    type: RegisterRequestDto,
    description: 'Company and admin user registration data',
  })
  @ApiResponse({
    status: 201,
    description: 'Company and user registered successfully',
    type: RegisterResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Company and admin user created successfully',
        companyId: 1,
        userId: 1,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data or company already exists',
  })
  async register(@Body() dto: RegisterRequestDto) {
    return this.identityService.register(dto.company, dto.user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password to get JWT token',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User credentials',
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 1,
          email: 'user@example.com',
          role: 'COMPANY_USER',
          companyId: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or password missing',
  })
  async login(@Body() dto: { email: string; pass?: string; password?: string }) {
    const password = dto.password ?? dto.pass;
    if (!password) {
      throw new UnauthorizedException('Password is required');
    }
    const user = await this.authService.validateUser(dto.email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }
}
