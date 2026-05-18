import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {
  IdentityService,
  CompanyDto,
  AdminUserDto,
} from '../identity/identity.service.js';

interface RegisterRequestDto {
  company: CompanyDto;
  user: AdminUserDto;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly identityService: IdentityService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterRequestDto) {
    return this.identityService.register(dto.company, dto.user);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
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
