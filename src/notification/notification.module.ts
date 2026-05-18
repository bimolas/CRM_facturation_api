import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity.js';
import { NotificationService } from './notification.service.js';
import { TypeOrmNotificationRepository } from './typeorm-notification.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [
    { provide: 'INotificationRepository', useClass: TypeOrmNotificationRepository },
    NotificationService,
  ],
  exports: ['INotificationRepository', NotificationService],
})
export class NotificationModule {}
