import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import {
  IdentityService,
  CompanyDto,
  AdminUserDto,
} from '../identity/identity.service.js';
import { LoginDto, LoginResponseDto, RegisterRequestDto, RegisterResponseDto } from './dto/auth.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';

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
    description: 'Create a new company with an initial admin user account and return JWT token',
  })
  @ApiBody({
    type: RegisterRequestDto,
    description: 'Company and admin user registration data',
  })
  @ApiResponse({
    status: 201,
    description: 'Company and user registered successfully, JWT returned',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data or company already exists',
  })
  async register(@Body() dto: RegisterRequestDto) {
    // 1. Create the company + user
    const { company, user } = await this.identityService.register(dto.company, dto.user);
    
    // 2. Auto-login: generate JWT for the newly created user
    const userWithCompany = { ...user, company };
    return this.authService.login(userWithCompany);
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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user and their company information',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() currentUser: any) {
    const user = await this.identityService.getUser(currentUser.userId);
    const company = await this.identityService.getCompany(currentUser.companyId);
    return { user, company };
  }
}
