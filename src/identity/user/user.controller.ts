import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { User } from './user.entity.js';
import { SystemRole } from '../enum/system-role.enum.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';

interface CreateUserDto {
  email: string;
  passwordHash: string;
  role: SystemRole;
  companyId: number;
}

interface UpdateUserDto {
  email?: string;
  role?: SystemRole;
  companyId?: number;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@CurrentUser() currentUser: any): Promise<User[]> {
    const allUsers = await this.userService.findAll();
    if (currentUser.role === SystemRole.PLATFORM_ADMIN) {
      return allUsers;
    }
    if (currentUser.role === SystemRole.COMPANY_ADMIN) {
      return allUsers.filter((u) => u.company?.id === currentUser.companyId);
    }
    // COMPANY_USER can only see themselves
    return allUsers.filter((u) => u.id === currentUser.userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ): Promise<User> {
    const user = await this.userService.findOne(id);
    if (currentUser.role === SystemRole.PLATFORM_ADMIN) {
      return user;
    }
    if (currentUser.role === SystemRole.COMPANY_ADMIN) {
      if (user.company?.id !== currentUser.companyId) {
        throw new ForbiddenException('You cannot access users outside your company');
      }
      return user;
    }
    if (user.id !== currentUser.userId) {
      throw new ForbiddenException('You cannot access other user records');
    }
    return user;
  }

  @Post()
  @Roles(SystemRole.PLATFORM_ADMIN, SystemRole.COMPANY_ADMIN)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: any,
  ): Promise<User> {
    if (currentUser.role === SystemRole.COMPANY_ADMIN) {
      if (dto.companyId !== currentUser.companyId) {
        throw new ForbiddenException('You cannot create users for other companies');
      }
      if (dto.role === SystemRole.PLATFORM_ADMIN) {
        throw new ForbiddenException('You cannot create a platform admin');
      }
    }
    return this.userService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ): Promise<User> {
    const targetUser = await this.userService.findOne(id);
    if (currentUser.role === SystemRole.PLATFORM_ADMIN) {
      return this.userService.update(id, dto);
    }
    if (currentUser.role === SystemRole.COMPANY_ADMIN) {
      if (targetUser.company?.id !== currentUser.companyId) {
        throw new ForbiddenException('You cannot update users outside your company');
      }
      if (dto.companyId && dto.companyId !== currentUser.companyId) {
        throw new ForbiddenException('You cannot move users to other companies');
      }
      if (dto.role === SystemRole.PLATFORM_ADMIN) {
        throw new ForbiddenException('You cannot assign platform admin role');
      }
      return this.userService.update(id, dto);
    }
    // COMPANY_USER
    if (id !== currentUser.userId) {
      throw new ForbiddenException('You can only update your own user record');
    }
    if (dto.role || dto.companyId) {
      throw new ForbiddenException('You cannot change your own role or company');
    }
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRole.PLATFORM_ADMIN, SystemRole.COMPANY_ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: any,
  ): Promise<void> {
    const targetUser = await this.userService.findOne(id);
    if (currentUser.role === SystemRole.PLATFORM_ADMIN) {
      return this.userService.remove(id);
    }
    // COMPANY_ADMIN
    if (targetUser.company?.id !== currentUser.companyId) {
      throw new ForbiddenException('You cannot delete users outside your company');
    }
    return this.userService.remove(id);
  }
}

