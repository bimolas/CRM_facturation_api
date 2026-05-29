import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarEvent } from './calendar-event.entity.js';
import { Holiday } from './holiday.entity.js';
import { WorkItem } from '../contracting/work-item/work-item.entity.js';
import { CalendarService } from './calendar.service.js';
import { CalendarController } from './calendar.controller.js';
import { DomainServicesModule } from '../domain-services/domain-services.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarEvent, Holiday, WorkItem]),
    DomainServicesModule,
  ],
  providers: [CalendarService],
  controllers: [CalendarController],
  exports: [CalendarService],
})
export class CalendarModule {}
