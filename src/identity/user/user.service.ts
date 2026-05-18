import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { User } from './user.entity.js';
import { IUserRepository } from './user.repository.interface.js';
import { SystemRole } from '../enum/system-role.enum.js';
import { CompanyService } from '../company/company.service.js';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: IUserRepository,
    private readonly companyService: CompanyService,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepo.findAll();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email);
  }

  async create(dto: {
    email: string;
    passwordHash: string;
    role: SystemRole;
    companyId: number;
  }): Promise<User> {
    const company = await this.companyService.findOne(dto.companyId);
    const user = new User({
      email: dto.email,
      passwordHash: dto.passwordHash,
      role: dto.role,
      company,
    });
    return this.userRepo.save(user);
  }

  async update(
    id: number,
    dto: Partial<{ email: string; role: SystemRole; companyId: number }>,
  ): Promise<User> {
    const user = await this.findOne(id);
    if (dto.email) user.email = dto.email;
    if (dto.role) user.role = dto.role;
    if (dto.companyId) {
      user.company = await this.companyService.findOne(dto.companyId);
    }
    return this.userRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }
}
