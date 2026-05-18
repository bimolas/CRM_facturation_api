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
import { CompanyService } from './company.service.js';
import { Company } from './company.entity.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { SystemRole } from '../enum/system-role.enum.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Roles(SystemRole.PLATFORM_ADMIN)
  findAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<Company> {
    if (user.role !== SystemRole.PLATFORM_ADMIN && user.companyId !== id) {
      throw new ForbiddenException('You cannot access other company data');
    }
    return this.companyService.findOne(id);
  }

  @Post()
  @Roles(SystemRole.PLATFORM_ADMIN)
  create(@Body() dto: Omit<Company, 'id'>): Promise<Company> {
    return this.companyService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<Omit<Company, 'id'>>,
    @CurrentUser() user: any,
  ): Promise<Company> {
    if (user.role !== SystemRole.PLATFORM_ADMIN && user.companyId !== id) {
      throw new ForbiddenException('You cannot update other company data');
    }
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRole.PLATFORM_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.companyService.remove(id);
  }
}
