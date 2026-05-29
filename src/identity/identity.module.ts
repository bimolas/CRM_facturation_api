import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company/company.entity.js';
import { User } from './user/user.entity.js';
import { CompanyService } from './company/company.service.js';
import { CompanyController } from './company/company.controller.js';
import { UserService } from './user/user.service.js';
import { UserController } from './user/user.controller.js';
import { TypeOrmCompanyRepository } from './company/typeorm-company.repository.js';
import { TypeOrmUserRepository } from './user/typeorm-user.repository.js';
import { IdentityService } from './identity.service.js';
import { SystemRole } from './enum/system-role.enum.js';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User])],
  controllers: [CompanyController, UserController],
  providers: [
    // Concrete implementations
    TypeOrmCompanyRepository,
    TypeOrmUserRepository,
    // Interface token bindings (Spring Data JPA emulation)
    { provide: 'ICompanyRepository', useClass: TypeOrmCompanyRepository },
    { provide: 'IUserRepository', useClass: TypeOrmUserRepository },
    // Application services
    CompanyService,
    UserService,
    IdentityService,
  ],
  exports: [CompanyService, UserService, IdentityService],
})
export class IdentityModule {
}

