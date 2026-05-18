import { User } from './user.entity.js';

export abstract class IUserRepository {
  abstract findAll(): Promise<User[]>;
  abstract findOne(id: number): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract save(user: User): Promise<User>;
  abstract remove(user: User): Promise<void>;
}
