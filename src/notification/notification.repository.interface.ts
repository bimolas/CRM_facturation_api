import { Notification } from './notification.entity.js';

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findByCompany(companyId: number): Promise<Notification[]>;
  findByUser(userId: number): Promise<Notification[]>;
}
