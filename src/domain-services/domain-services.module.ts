import { Module } from '@nestjs/common';
import { InvoiceCalculatorService } from './invoice-calculator.service.js';
import { FinancialAnalyticsEngine } from './financial-analytics.service.js';
import { EInvoicingGateway } from './e-invoicing.gateway.js';

@Module({
  providers: [InvoiceCalculatorService, FinancialAnalyticsEngine, EInvoicingGateway],
  exports: [InvoiceCalculatorService, FinancialAnalyticsEngine, EInvoicingGateway],
})
export class DomainServicesModule {}
