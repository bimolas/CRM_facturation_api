import { Module, OnApplicationBootstrap } from '@nestjs/common';
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
import * as bcrypt from 'bcrypt';

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
export class IdentityModule implements OnApplicationBootstrap {
  constructor(
    private readonly userService: UserService,
    private readonly companyService: CompanyService,
  ) {}

  async onApplicationBootstrap() {
    try {
      const users = await this.userService.findAll();
      const hasPlatformAdmin = users.some(
        (u) => u.role === SystemRole.PLATFORM_ADMIN,
      );
      if (!hasPlatformAdmin) {
        console.log('Seeding default PLATFORM_ADMIN user...');
        let platformCompany;
        try {
          platformCompany = await this.companyService.findOne(1);
        } catch {
          platformCompany = await this.companyService.create({
            name: 'Platform Inc',
            ice: 'PLATFORM_ICE_123',
            rc: 'PLATFORM_RC_123',
            taxIdentifier: 'PLATFORM_TAX_123',
            email: 'platform@example.com',
            physicalAddress: 'Platform Address',
            logoUrl: null,
            isActive: true,
          });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        await this.userService.create({
          email: 'admin@example.com',
          passwordHash,
          role: SystemRole.PLATFORM_ADMIN,
          companyId: platformCompany.id,
        });
        console.log('PLATFORM_ADMIN user successfully seeded.');
      }
    } catch (error) {
      console.error('Error during PLATFORM_ADMIN seeding:', error);
    }
  }
}

