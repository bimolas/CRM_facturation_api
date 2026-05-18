import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity.js';
import { INotificationRepository } from './notification.repository.interface.js';

@Injectable()
export class TypeOrmNotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  save(notification: Notification): Promise<Notification> {
    return this.repo.save(notification);
  }

  findByCompany(companyId: number): Promise<Notification[]> {
    return this.repo.find({ where: { company: { id: companyId } }, order: { createdAt: 'DESC' } });
  }

  findByUser(userId: number): Promise<Notification[]> {
    return this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }
}
