import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from './company/company.entity.js';
import { User } from './user/user.entity.js';
import { SystemRole } from './enum/system-role.enum.js';

export interface CompanyDto {
  name: string;
  ice: string;
  rc: string;
  taxIdentifier: string;
  email: string;
  physicalAddress?: string;
  logoUrl?: string;
}

export interface AdminUserDto {
  email: string;
  password: string;
}

@Injectable()
export class IdentityService {
  constructor(private readonly dataSource: DataSource) {}

  async register(
    companyDto: CompanyDto,
    userDto: AdminUserDto,
  ): Promise<{ company: Company; user: User }> {
    const existingUser = await this.dataSource
      .getRepository(User)
      .findOne({ where: { email: userDto.email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userDto.password, salt);

    return this.dataSource.transaction(async (manager) => {
      const company = new Company({
        name: companyDto.name,
        ice: companyDto.ice,
        rc: companyDto.rc,
        taxIdentifier: companyDto.taxIdentifier,
        email: companyDto.email,
        physicalAddress: companyDto.physicalAddress,
        logoUrl: companyDto.logoUrl,
        isActive: true,
      });
      const savedCompany = await manager.save(company);

      const user = new User({
        email: userDto.email,
        passwordHash,
        role: SystemRole.COMPANY_ADMIN,
        company: savedCompany,
      });
      const savedUser = await manager.save(user);

      return { company: savedCompany, user: savedUser };
    });
  }

  async getUser(id: number): Promise<User | null> {
    return this.dataSource.getRepository(User).findOneBy({ id });
  }

  async getCompany(id: number): Promise<Company | null> {
    return this.dataSource.getRepository(Company).findOneBy({ id });
  }
}
