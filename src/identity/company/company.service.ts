import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Company } from './company.entity.js';
import { ICompanyRepository } from './company.repository.interface.js';

@Injectable()
export class CompanyService {
  constructor(
    @Inject('ICompanyRepository')
    private readonly companyRepo: ICompanyRepository,
  ) {}

  findAll(): Promise<Company[]> {
    return this.companyRepo.findAll();
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companyRepo.findOne(id);
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    return company;
  }

  async create(dto: Omit<Company, 'id'>): Promise<Company> {
    const company = new Company({ ...dto });
    return this.companyRepo.save(company);
  }

  async update(id: number, dto: Partial<Omit<Company, 'id'>>): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, dto);
    return this.companyRepo.save(company);
  }

  async remove(id: number): Promise<void> {
    const company = await this.findOne(id);
    await this.companyRepo.remove(company);
  }
}
