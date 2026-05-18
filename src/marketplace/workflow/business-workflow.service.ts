import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BusinessWorkflow } from './business-workflow.entity.js';
import { IBusinessWorkflowRepository } from './business-workflow.repository.interface.js';
import { IWorkflowHistoryRepository } from '../history/workflow-history.repository.interface.js';
import { WorkflowHistory } from '../history/workflow-history.entity.js';
import { WorkflowStatus } from '../enum/workflow-status.enum.js';
import { CompanyService } from '../../identity/company/company.service.js';
import { UserService } from '../../identity/user/user.service.js';
import { User } from '../../identity/user/user.entity.js';
import { SystemRole } from '../../identity/enum/system-role.enum.js';
import { Devis } from '../../finance/devis/devis.entity.js';
import { Facture } from '../../finance/facture/facture.entity.js';
import { NotificationService } from '../../notification/notification.service.js';
import type { IInventoryItemRepository } from '../../execution/inventory/inventory-item.repository.interface.js';
import type { IProjectMilestoneRepository } from '../../execution/milestone/project-milestone.repository.interface.js';
import { ProjectMilestone } from '../../execution/milestone/project-milestone.entity.js';
import { Article } from '../../catalog/article/article.entity.js';
import { DocumentItem } from '../../finance/common/document-item.entity.js';
import { InvoiceCalculatorService } from '../../domain-services/invoice-calculator.service.js';

@Injectable()
export class BusinessWorkflowService {
  constructor(
    @Inject('IBusinessWorkflowRepository')
    private readonly workflowRepo: IBusinessWorkflowRepository,
    @Inject('IWorkflowHistoryRepository')
    private readonly historyRepo: IWorkflowHistoryRepository,
    private readonly companyService: CompanyService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    @Inject('IInventoryItemRepository')
    private readonly inventoryRepo: IInventoryItemRepository,
    @Inject('IProjectMilestoneRepository')
    private readonly milestoneRepo: IProjectMilestoneRepository,
  ) {}

  // ─── Queries ─────────────────────────────────────────────────────────────

  async findAll(user: { userId: number; companyId: number; role: SystemRole }): Promise<BusinessWorkflow[]> {
    const workflows = await this.workflowRepo.findAll();
    if (user.role === SystemRole.PLATFORM_ADMIN) {
      return workflows;
    }
    return workflows.filter((w) => {
      const isBuyer = w.buyerCompany?.id === user.companyId;
      const isSellerWhoBid = w.bids?.some(b => b.biddingSeller?.id === user.companyId);
      const isActive = w.stateCode === WorkflowStatus.PUBLISHED;
      return isBuyer || isSellerWhoBid || isActive;
    });
  }

  async findOne(id: number, user?: { userId: number; companyId: number; role: SystemRole }): Promise<BusinessWorkflow> {
    const wf = await this.workflowRepo.findOne(id);
    if (!wf) throw new NotFoundException(`BusinessWorkflow #${id} not found`);
    
    if (user && user.role !== SystemRole.PLATFORM_ADMIN) {
      const isBuyer = wf.buyerCompany?.id === user.companyId;
      const isSellerWhoBid = wf.bids?.some(b => b.biddingSeller?.id === user.companyId);
      const isActive = wf.stateCode === WorkflowStatus.PUBLISHED;
      if (!isBuyer && !isSellerWhoBid && !isActive) {
        throw new ForbiddenException('You do not have permission to view this workflow');
      }
    }
    return wf;
  }

  async findActivePublicTenders(): Promise<BusinessWorkflow[]> {
    const workflows = await this.workflowRepo.findAll();
    return workflows.filter((w) => w.stateCode === WorkflowStatus.PUBLISHED);
  }

  findHistory(workflowId: number): Promise<WorkflowHistory[]> {
    return this.historyRepo.findByWorkflow(workflowId);
  }

  // ─── Commands (each wrapped in a transaction) ─────────────────────────────

  async create(dto: {
    title: string;
    description: string;
    budgetCeiling: number;
    buyerCompanyId: number;
    technicalCategory?: string;
    submissionDeadline?: string;
    expectedDeliveryDate?: string;
    currency?: string;
    rfpFileUrl?: string;
  }): Promise<BusinessWorkflow> {
    const buyerCompany = await this.companyService.findOne(dto.buyerCompanyId);
    const workflow = new BusinessWorkflow({
      title: dto.title,
      description: dto.description,
      budgetCeiling: dto.budgetCeiling,
      technicalCategory: dto.technicalCategory,
      submissionDeadline: dto.submissionDeadline ? new Date(dto.submissionDeadline) : undefined,
      expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
      currency: dto.currency ?? 'MAD',
      rfpFileUrl: dto.rfpFileUrl,
      buyerCompany: buyerCompany,
      stateCode: WorkflowStatus.DRAFT,
    });
    
    const savedWf = await this.workflowRepo.save(workflow);
    await this.notificationService.createNotification(`Workflow "${savedWf.title}" created.`, 'CREATED', undefined, buyerCompany);
    return savedWf;
  }

  async publish(workflowId: number, actorId: number, companyId: number, role: SystemRole): Promise<BusinessWorkflow> {
    const [wf, actor] = await Promise.all([
      this.findOne(workflowId),
      this.userService.findOne(actorId),
    ]);
    
    if (role !== SystemRole.PLATFORM_ADMIN && (role !== SystemRole.COMPANY_ADMIN || wf.buyerCompany?.id !== companyId)) {
      throw new ForbiddenException('Only the buyer company admin or platform admin can publish this workflow');
    }

    wf.publish();
    await this.notificationService.createNotification(`Workflow "${wf.title}" published.`, 'CREATED', actor, wf.buyerCompany);
    return this.saveWithHistory(wf, actor, 'Workflow published to marketplace.');
  }

  async submitBid(
    workflowId: number,
    actorId: number,
    companyId: number,
    role: SystemRole,
    dto: {
      referenceNumber: string;
      issueDate: Date;
      validUntil: Date;
      sellerCompanyId: number;
      deliveryLeadTime?: number;
      downPaymentPercentage?: number;
      balanceDueDays?: number;
      revisionNumber?: number;
      vendorNotes?: string;
      technicalProposalFileUrl?: string;
      financialQuoteFileUrl?: string;
      items?: { articleId: number; quantity: number; discountAmount?: number }[];
    },
  ): Promise<BusinessWorkflow> {
    if (role === SystemRole.PLATFORM_ADMIN) {
      throw new ForbiddenException('Platform administrators cannot submit bids');
    }
    if (dto.sellerCompanyId !== companyId) {
      throw new ForbiddenException('You can only submit a bid on behalf of your own company');
    }

    const [wf, actor, seller] = await Promise.all([
      this.findOne(workflowId),
      this.userService.findOne(actorId),
      this.companyService.findOne(dto.sellerCompanyId),
    ]);

    const documentItems: DocumentItem[] = [];
    if (dto.items && dto.items.length > 0) {
      const articleRepo = this.dataSource.getRepository(Article);
      for (const itemDto of dto.items) {
        const article = await articleRepo.findOne({ where: { id: itemDto.articleId } });
        if (!article) {
          throw new NotFoundException(`Article #${itemDto.articleId} not found`);
        }
        const documentItem = new DocumentItem({
          serviceName: article.name,
          quantity: itemDto.quantity,
          unitPriceHT: article.unitPriceHT,
          appliedTvaRate: article.category?.tvaRate ?? 0,
          discountAmount: itemDto.discountAmount ?? 0,
          article: article,
        });
        documentItems.push(documentItem);
      }
    }

    const bid = new Devis({
      referenceNumber: dto.referenceNumber,
      issueDate: dto.issueDate,
      validUntil: dto.validUntil,
      biddingSeller: seller,
      isAccepted: false,
      items: documentItems,
      subTotalHT: 0,
      totalTVA: 0,
      totalTTC: 0,
      filePath: null,
      workflow: wf,
      deliveryLeadTime: dto.deliveryLeadTime,
      downPaymentPercentage: dto.downPaymentPercentage,
      balanceDueDays: dto.balanceDueDays,
      revisionNumber: dto.revisionNumber ?? 1,
      vendorNotes: dto.vendorNotes,
      technicalProposalFileUrl: dto.technicalProposalFileUrl,
      financialQuoteFileUrl: dto.financialQuoteFileUrl,
    });

    const calculator = new InvoiceCalculatorService();
    calculator.applyTotals(bid);

    wf.submitBid(bid);
    return this.saveWithHistory(wf, actor, `Bid "${dto.referenceNumber}" submitted.`);
  }

  async acceptBid(
    workflowId: number,
    actorId: number,
    companyId: number,
    role: SystemRole,
    bidId: number,
    sellerCompanyId: number,
  ): Promise<BusinessWorkflow> {
    const [wf, actor, seller] = await Promise.all([
      this.findOne(workflowId),
      this.userService.findOne(actorId),
      this.companyService.findOne(sellerCompanyId),
    ]);

    if (role !== SystemRole.PLATFORM_ADMIN && (role !== SystemRole.COMPANY_ADMIN || wf.buyerCompany?.id !== companyId)) {
      throw new ForbiddenException('Only the buyer company admin or platform admin can accept bids');
    }

    const bid = wf.bids?.find((b) => b.id === bidId);
    if (!bid) throw new NotFoundException(`Bid #${bidId} not found on workflow #${workflowId}`);

    if (wf.technicalCategory?.toUpperCase() === 'MATERIAL') {
      for (const item of bid.items) {
        if (!item.article) continue;
        const inventoryItem = await this.inventoryRepo.findBySkuAndVendor(item.article.reference, sellerCompanyId);
        if (!inventoryItem || inventoryItem.availableStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for SKU "${item.article?.reference || 'unknown'}" in vendor's warehouse. ` +
            `Available: ${inventoryItem?.availableStock ?? 0}, Requested: ${item.quantity}`
          );
        }
      }
      // Subtract stock
      for (const item of bid.items) {
        if (!item.article) continue;
        const inventoryItem = await this.inventoryRepo.findBySkuAndVendor(item.article.reference, sellerCompanyId);
        if (inventoryItem) {
          inventoryItem.availableStock -= item.quantity;
          await this.inventoryRepo.save(inventoryItem);
        }
      }
    } else if (wf.technicalCategory?.toUpperCase() === 'IMMATERIAL') {
      const now = new Date();
      const deliveryDate = wf.expectedDeliveryDate ? new Date(wf.expectedDeliveryDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const diffTime = deliveryDate.getTime() - now.getTime();
      const midpoint = new Date(now.getTime() + diffTime / 2);

      const kickoffMilestone = new ProjectMilestone({
        title: 'Project Kickoff',
        deadline: now,
        isAchieved: false,
        workflow: wf,
      });
      const midtermMilestone = new ProjectMilestone({
        title: 'Midterm Progress Review',
        deadline: midpoint,
        isAchieved: false,
        workflow: wf,
      });
      const finalMilestone = new ProjectMilestone({
        title: 'Final Delivery & Acceptance',
        deadline: deliveryDate,
        isAchieved: false,
        workflow: wf,
      });

      await Promise.all([
        this.milestoneRepo.save(kickoffMilestone),
        this.milestoneRepo.save(midtermMilestone),
        this.milestoneRepo.save(finalMilestone),
      ]);
    }

    wf.acceptBid(bidId, seller);
    await this.notificationService.createNotification(`Bid #${bidId} accepted on Workflow "${wf.title}".`, 'VALIDATED', actor, wf.buyerCompany);
    return this.saveWithHistory(wf, actor, `Bid #${bidId} accepted. Seller: ${seller.name}.`);
  }

  async completeAndTest(
    workflowId: number,
    actorId: number,
    companyId: number,
    role: SystemRole,
  ): Promise<BusinessWorkflow> {
    const [wf, actor] = await Promise.all([
      this.findOne(workflowId),
      this.userService.findOne(actorId),
    ]);

    if (role !== SystemRole.PLATFORM_ADMIN && wf.chosenSellerCompany?.id !== companyId) {
      throw new ForbiddenException('Only the chosen seller company or platform admin can submit for testing');
    }

    wf.completeAndTest();
    return this.saveWithHistory(wf, actor, 'Deliverable submitted for client testing.');
  }

  async recordTestOutcome(
    workflowId: number,
    actorId: number,
    companyId: number,
    role: SystemRole,
    dto: {
      isAccepted: boolean;
      testDate?: Date;
      testerName?: string;
      rejectionReason?: string;
      pvRecetteFileUrl?: string;
    },
  ): Promise<BusinessWorkflow> {
    const [wf, actor] = await Promise.all([
      this.findOne(workflowId),
      this.userService.findOne(actorId),
    ]);

    if (role !== SystemRole.PLATFORM_ADMIN && wf.buyerCompany?.id !== companyId) {
      throw new ForbiddenException('Only the buyer company or platform admin can record test outcome');
    }

    if (dto.testDate) wf.testDate = dto.testDate;
    if (dto.testerName) wf.testerName = dto.testerName;
    if (dto.pvRecetteFileUrl) wf.pvRecetteFileUrl = dto.pvRecetteFileUrl;

    if (dto.isAccepted) {
      wf.isAccepted = true;
      wf.fullyInvoice(); // Transition to fully invoiced if accepted
      return this.saveWithHistory(wf, actor, 'Test accepted. Proceeding to invoicing.');
    } else {
      wf.rejectTest(dto.rejectionReason || 'Rejected without reason');
      await this.notificationService.createNotification(`Test rejected for Workflow "${wf.title}": ${wf.rejectionReason}`, 'REJECTED', actor, wf.buyerCompany);
      return this.saveWithHistory(wf, actor, `Test rejected: ${wf.rejectionReason}`);
    }
  }

  async fullyInvoice(
    workflowId: number,
    actorId: number,
    companyId: number,
    role: SystemRole,
  ): Promise<BusinessWorkflow> {
    const [wf, actor] = await Promise.all([
      this.findOne(workflowId),
      this.userService.findOne(actorId),
    ]);

    const isInvolved = wf.buyerCompany?.id === companyId || wf.chosenSellerCompany?.id === companyId;
    if (role !== SystemRole.PLATFORM_ADMIN && (role !== SystemRole.COMPANY_ADMIN || !isInvolved)) {
      throw new ForbiddenException('Only company admins from involved companies or platform admins can trigger invoicing');
    }

    wf.fullyInvoice();

    // Phase 6: Sequential referenceNumber generation
    const currentYear = new Date().getFullYear();
    const sequentialRef = `FAC-${currentYear}-${String(wf.id).padStart(4, '0')}`;
    
    const facture = new Facture({
      referenceNumber: sequentialRef,
      issueDate: new Date(),
      subTotalHT: wf.budgetCeiling, // Placeholder logic for HT
      totalTVA: wf.budgetCeiling * 0.2,
      totalTTC: wf.budgetCeiling * 1.2,
      isClearedByDgi: false,
      workflow: wf,
      vendorBankRIB: '123456789012345678901234',
      qrCodeHash: 'sha256-mock-invoice-signature-hash-code-value',
    });

    if (!wf.documents) wf.documents = [];
    wf.documents.push(facture);

    return this.saveWithHistory(wf, actor, `Workflow fully invoiced. Invoice: ${sequentialRef}`);
  }

  // ─── Atomic transaction: persist state change + history snapshot ───────────

  private async saveWithHistory(
    wf: BusinessWorkflow,
    actor: User,
    notes: string,
  ): Promise<BusinessWorkflow> {
    return this.dataSource.transaction(async (manager) => {
      const savedWf = await manager.save(BusinessWorkflow, wf);

      const entry = new WorkflowHistory({
        workflow: savedWf,
        standardStatus: savedWf.stateCode,
        actor,
        timestamp: new Date(),
        notes,
      });
      await manager.save(WorkflowHistory, entry);

      return savedWf;
    });
  }
}
