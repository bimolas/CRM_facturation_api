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
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { CompanyService } from './company.service.js';
import { Company } from './company.entity.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { SystemRole } from '../enum/system-role.enum.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto.js';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
//@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Roles(SystemRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Get all companies',
    description: 'Retrieve a list of all companies (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Companies list retrieved successfully',
    type: [Company],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get company by ID',
    description:
      'Retrieve a specific company. Admins can access any company, regular users can only access their own.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Company ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Company retrieved successfully',
    type: Company,
  })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  @ApiResponse({ status: 404, description: 'Company not found' })
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
  @ApiOperation({
    summary: 'Create a new company',
    description: 'Add a new company to the system (admin only)',
  })
  @ApiBody({
    type: CreateCompanyDto,
    description: 'Company details',
  })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
    type: Company,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() dto: CreateCompanyDto): Promise<Company> {
    return this.companyService.create(dto as Omit<Company, 'id'>);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a company',
    description:
      'Update company information. Admins can update any company, users can only update their own.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Company ID',
    example: 1,
  })
  @ApiBody({
    type: UpdateCompanyDto,
    description: 'Fields to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
    type: Company,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
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
  @ApiOperation({
    summary: 'Delete a company',
    description: 'Remove a company from the system (admin only)',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Company ID',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Company deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.companyService.remove(id);
  }
}
