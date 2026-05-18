import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity.js';
import { ICompanyRepository } from './company.repository.interface.js';

@Injectable()
export class TypeOrmCompanyRepository extends ICompanyRepository {
  constructor(
    @InjectRepository(Company)
    private readonly repo: Repository<Company>,
  ) {
    super();
  }

  findAll(): Promise<Company[]> {
    return this.repo.find();
  }

  findOne(id: number): Promise<Company | null> {
    return this.repo.findOneBy({ id });
  }

  findByIce(ice: string): Promise<Company | null> {
    return this.repo.findOneBy({ ice });
  }

  async save(company: Company): Promise<Company> {
    return this.repo.save(company);
  }

  async remove(company: Company): Promise<void> {
    await this.repo.remove(company);
  }
}
