import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEvent } from './calendar-event.entity.js';
import { Holiday } from './holiday.entity.js';
import { WorkItem } from '../contracting/work-item/work-item.entity.js';
import { CalendarConflictService } from '../domain-services/calendar-conflict.service.js';
import { PaymentScheduleService } from '../domain-services/payment-schedule.service.js';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly eventRepo: Repository<CalendarEvent>,
    @InjectRepository(Holiday)
    private readonly holidayRepo: Repository<Holiday>,
    @InjectRepository(WorkItem)
    private readonly workItemRepo: Repository<WorkItem>,
    private readonly conflictService: CalendarConflictService,
    private readonly paymentScheduleService: PaymentScheduleService,
  ) {}

  async generateEventsForWorkItem(
    workItem: WorkItem,
    sellerCompanyId: number,
    buyerCompanyId: number,
    holidays: Date[],
  ): Promise<CalendarEvent[]> {
    const events: Partial<CalendarEvent>[] = [];

    if (workItem.type === 'material') {
      const startDate = new Date(workItem.startDate);
      const endDate = new Date(workItem.endDate);

      // PACKAGING on startDate
      events.push({ workItem, workflow: workItem.workflow, eventType: 'PACKAGING', eventDate: startDate.toISOString().split('T')[0] as any });

      // DEPARTURE on startDate + 1 business day
      const departureDays = this.conflictService.getBusinessDays(
        new Date(startDate.getTime() + 86400000),
        new Date(startDate.getTime() + 7 * 86400000),
        holidays,
      );
      const departureDate = departureDays[0] ?? new Date(startDate.getTime() + 86400000);
      events.push({ workItem, workflow: workItem.workflow, eventType: 'DEPARTURE', eventDate: departureDate.toISOString().split('T')[0] as any });

      // ARRIVAL on endDate
      events.push({ workItem, workflow: workItem.workflow, eventType: 'ARRIVAL', eventDate: endDate.toISOString().split('T')[0] as any });

    } else if (workItem.type === 'service') {
      const businessDays = this.conflictService.getBusinessDays(
        new Date(workItem.startDate),
        new Date(workItem.endDate),
        holidays,
      );
      for (const day of businessDays) {
        events.push({ workItem, workflow: workItem.workflow, eventType: 'SERVICE_DAY', eventDate: day.toISOString().split('T')[0] as any });
      }

    } else if (workItem.type === 'subscription') {
      const schedule = this.paymentScheduleService.generate(
        new Date(workItem.startDate),
        new Date(workItem.endDate),
        1, // amount doesn't matter for calendar events
      );
      for (const entry of schedule) {
        events.push({ workItem, workflow: workItem.workflow, eventType: 'BILLING_CYCLE', eventDate: entry.dueDate.toISOString().split('T')[0] as any });
      }
    }

    const saved = await this.eventRepo.save(events as CalendarEvent[]);
    return saved;
  }

  async recomputeConflicts(companyId: number): Promise<void> {
    // Load all work items where the company is the seller
    const workItems = await this.workItemRepo.find({
      where: { workflow: { chosenSellerCompany: { id: companyId } } },
      relations: ['workflow', 'workflow.chosenSellerCompany'],
    });

    const holidays = await this.holidayRepo.find({ where: { company: { id: companyId } } });
    const holidayDates = holidays.map((h) => new Date(h.date));

    const materialItems = workItems.filter((w) => w.type === 'material');
    const serviceItems = workItems.filter((w) => w.type === 'service');

    const materialConflicts = this.conflictService.detectMaterialConflicts(materialItems, companyId);
    const serviceConflicts = this.conflictService.detectServiceConflicts(serviceItems, holidayDates, companyId);

    // Update calendar events for conflicting work items
    for (const [workItemId, conflictingIds] of [...materialConflicts, ...serviceConflicts]) {
      await this.eventRepo.update(
        { workItem: { id: workItemId } },
        { hasConflict: true, conflictingWorkItemIds: conflictingIds.map(String) as any },
      );
    }
  }

  async getEvents(companyId: number, from: Date, to: Date): Promise<CalendarEvent[]> {
    return this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.workItem', 'workItem')
      .leftJoinAndSelect('event.workflow', 'workflow')
      .leftJoinAndSelect('workflow.buyerCompany', 'buyerCompany')
      .leftJoinAndSelect('workflow.chosenSellerCompany', 'sellerCompany')
      .where('event.eventDate BETWEEN :from AND :to', {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      })
      .andWhere('(buyerCompany.id = :companyId OR sellerCompany.id = :companyId)', { companyId })
      .orderBy('event.eventDate', 'ASC')
      .getMany();
  }

  async createHoliday(companyId: number, date: string, label: string): Promise<Holiday> {
    const holiday = this.holidayRepo.create({
      company: { id: companyId } as any,
      date: date as any,
      label,
    });
    return this.holidayRepo.save(holiday);
  }

  async listHolidays(companyId: number): Promise<Holiday[]> {
    return this.holidayRepo.find({ where: { company: { id: companyId } } });
  }
}
