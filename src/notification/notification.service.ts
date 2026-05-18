import { Injectable, Inject } from '@nestjs/common';
import { Notification } from './notification.entity.js';
import type { INotificationRepository } from './notification.repository.interface.js';
import { User } from '../identity/user/user.entity.js';
import { Company } from '../identity/company/company.entity.js';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async createNotification(message: string, type: string, user?: User, company?: Company): Promise<Notification> {
    const notification = new Notification({
      message,
      type,
      user,
      company,
    });
    return this.notificationRepo.save(notification);
  }

  getCompanyNotifications(companyId: number): Promise<Notification[]> {
    return this.notificationRepo.findByCompany(companyId);
  }

  getUserNotifications(userId: number): Promise<Notification[]> {
    return this.notificationRepo.findByUser(userId);
  }
}
