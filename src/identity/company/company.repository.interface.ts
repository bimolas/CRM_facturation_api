import { Company } from './company.entity.js';

export abstract class ICompanyRepository {
  abstract findAll(): Promise<Company[]>;
  abstract findOne(id: number): Promise<Company | null>;
  abstract findByIce(ice: string): Promise<Company | null>;
  abstract save(company: Company): Promise<Company>;
  abstract remove(company: Company): Promise<void>;
}
