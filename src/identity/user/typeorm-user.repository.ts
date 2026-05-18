import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';
import { IUserRepository } from './user.repository.interface.js';

@Injectable()
export class TypeOrmUserRepository extends IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {
    super();
  }

  findAll(): Promise<User[]> {
    return this.repo.find({ relations: ['company'] });
  }

  findOne(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id }, relations: ['company'] });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email }, relations: ['company'] });
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async remove(user: User): Promise<void> {
    await this.repo.remove(user);
  }
}
