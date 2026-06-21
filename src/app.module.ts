import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ─── Domain Modules ───────────────────────────────────────────────────────────
import { IdentityModule } from './identity/identity.module.js';
import { MarketplaceModule } from './marketplace/marketplace.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { ExecutionModule } from './execution/execution.module.js';
import { DomainServicesModule } from './domain-services/domain-services.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { AuthModule } from './auth/auth.module.js';
import { MessageModule } from './message/message.module.js';
import { NegotiationModule } from './contracting/negotiation/negotiation.module.js';
import { TeamsModule } from './teams/team.module.js';
import { WorkItemModule } from './contracting/work-item/work-item.module.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { BidModule } from './contracting/bid/bid.module.js';
import { UploadModule } from './upload/upload.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// ─── Entities (explicit list — required for nodenext module resolution) ───────
import { Company } from './identity/company/company.entity.js';
import { User } from './identity/user/user.entity.js';
import { BusinessWorkflow } from './marketplace/workflow/business-workflow.entity.js';
import { WorkflowHistory } from './marketplace/history/workflow-history.entity.js';
import { Document } from './finance/common/document.entity.js';
import { DocumentItem } from './finance/common/document-item.entity.js';
import { Devis } from './finance/devis/devis.entity.js';
import { BonDeCommande } from './finance/bon-de-commande/bon-de-commande.entity.js';
import { Facture } from './finance/facture/facture.entity.js';
import { Paiement } from './finance/paiement/paiement.entity.js';
import { ProjectTask } from './execution/project-task/project-task.entity.js';
import { InventoryItem } from './execution/inventory/inventory-item.entity.js';
import { StockAllocation } from './execution/stock-allocation/stock-allocation.entity.js';
import { Category } from './catalog/category/category.entity.js';
import { Article } from './catalog/article/article.entity.js';
import { Notification } from './notification/notification.entity.js';
import { ProjectMilestone } from './execution/milestone/project-milestone.entity.js';
import { Message } from './message/message.entity.js';
import { NegotiationMessage } from './contracting/negotiation/negotiation-message.entity.js';
import { Team } from './teams/team.entity.js';
import { TeamMember } from './teams/team-member.entity.js';
import { WorkItem } from './contracting/work-item/work-item.entity.js';
import { Task } from './contracting/task/task.entity.js';
import { Holiday } from './calendar/holiday.entity.js';
import { CalendarEvent } from './calendar/calendar-event.entity.js';
import { PaymentInstallment } from './contracting/payment/payment-installment.entity.js';

@Module({
  imports: [
    // ── Database Connection ────────────────────────────────────────────────
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? '1002',
      database: process.env.DB_DATABASE ?? 'crm_facturation',
      entities: [
        Company,
        User,
        BusinessWorkflow,
        WorkflowHistory,
        Document,
        DocumentItem,
        Devis,
        BonDeCommande,
        Facture,
        Paiement,
        ProjectTask,
        InventoryItem,
        StockAllocation,
        Category,
        Article,
        Notification,
        ProjectMilestone,
        Message,
        NegotiationMessage,
        Team,
        TeamMember,
        WorkItem,
        Task,
        Holiday,
        CalendarEvent,
        PaymentInstallment,
      ],
      synchronize: true,
      logging: process.env.NODE_ENV !== 'production',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // ── Feature Modules ───────────────────────────────────────────────────
    DomainServicesModule,
    IdentityModule,
    ExecutionModule,
    FinanceModule,
    MarketplaceModule,
    CatalogModule,
    NotificationModule,
    AuthModule,
    MessageModule,
    NegotiationModule,
    TeamsModule,
    WorkItemModule,
    CalendarModule,
    BidModule,
    UploadModule,
  ],
})
export class AppModule {}
