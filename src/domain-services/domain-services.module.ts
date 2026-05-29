import { Module } from '@nestjs/common';
import { InvoiceCalculatorService } from './invoice-calculator.service.js';
import { FinancialAnalyticsEngine } from './financial-analytics.service.js';
import { EInvoicingGateway } from './e-invoicing.gateway.js';
import { WorkItemStatusService } from './work-item-status.service.js';
import { PaymentScheduleService } from './payment-schedule.service.js';
import { CalendarConflictService } from './calendar-conflict.service.js';

@Module({
  providers: [InvoiceCalculatorService, FinancialAnalyticsEngine, EInvoicingGateway, WorkItemStatusService, PaymentScheduleService, CalendarConflictService],
  exports: [InvoiceCalculatorService, FinancialAnalyticsEngine, EInvoicingGateway, WorkItemStatusService, PaymentScheduleService, CalendarConflictService],
})
export class DomainServicesModule {}
