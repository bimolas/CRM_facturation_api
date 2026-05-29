import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
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
import { BonDeCommande } from '../../finance/bon-de-commande/bon-de-commande.entity.js';
import { NotificationService } from '../../notification/notification.service.js';
import type { IInventoryItemRepository } from '../../execution/inventory/inventory-item.repository.interface.js';
import type { IStockAllocationRepository } from '../../execution/stock-allocation/stock-allocation.repository.interface.js';
import type { IProjectMilestoneRepository } from '../../execution/milestone/project-milestone.repository.interface.js';
import { ProjectMilestone } from '../../execution/milestone/project-milestone.entity.js';
import { StockAllocation } from '../../execution/stock-allocation/stock-allocation.entity.js';
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
    @Inject('IStockAllocationRepository')
    private readonly stockAllocationRepo: IStockAllocationRepository,
    @Inject('IProjectMilestoneRepository')
    private readonly milestoneRepo: IProjectMilestoneRepository,
  ) {}

  // ─── Queries ─────────────────────────────────────────────────────────────

  async findAll(user: { userId: number; companyId: number; role: SystemRole }, mine?: boolean): Promise<BusinessWorkflow[]> {
    const workflows = await this.workflowRepo.findAll();

    if (mine) {
      return workflows.filter((w) => w.buyerCompany?.id === user.companyId);
    }

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

  async findActivePublicTenders(filters?: {
    technicalCategory?: string;
    budgetCeiling?: number;
    region?: string;
    createdAfter?: string;
  }): Promise<BusinessWorkflow[]> {
    const workflows = await this.workflowRepo.findAll();
    let results = workflows.filter((w) => w.stateCode === WorkflowStatus.PUBLISHED);

    if (filters) {
      if (filters.technicalCategory) {
        const cat = filters.technicalCategory.toLowerCase();
        results = results.filter((w) => w.technicalCategory?.toLowerCase().includes(cat));
      }
      if (filters.budgetCeiling !== undefined) {
        results = results.filter((w) => Number(w.budgetCeiling) <= filters.budgetCeiling!);
      }
      if (filters.region) {
        const region = filters.region.toLowerCase();
        results = results.filter((w) => w.region?.toLowerCase().includes(region));
      }
      // createdAfter: ignored for now as entity has no createdAt field
    }

    return results;
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
    workflowType: string;
    region?: string;
    requirements?: string[];
    constraints?: string[];
    conditions?: string;
    evaluationCriteria?: string;
  }): Promise<BusinessWorkflow> {
    if (!['material', 'service', 'subscription'].includes(dto.workflowType)) {
      throw new BadRequestException('workflowType must be one of: material, service, subscription');
    }

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
      workflowType: dto.workflowType as 'material' | 'service' | 'subscription',
      region: dto.region,
      requirements: dto.requirements,
      constraints: dto.constraints,
      conditions: dto.conditions,
      evaluationCriteria: dto.evaluationCriteria,
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
      items?: {
        articleId?: number;
        serviceName?: string;
        unitPriceHT?: number;
        appliedTvaRate?: number;
        quantity: number;
        discountAmount?: number;
      }[];
    },
  ): Promise<BusinessWorkflow> {
    console.log('submitBid called with:', { workflowId, actorId, companyId, role, dto });
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
        let article: Article | null = null;
        if (itemDto.articleId) {
          article = await articleRepo.findOne({ where: { id: itemDto.articleId } });
          if (!article) {
            throw new NotFoundException(`Article #${itemDto.articleId} not found`);
          }
        }

        const serviceName = itemDto.serviceName ?? article?.name;
        const unitPriceHT = itemDto.unitPriceHT ?? article?.unitPriceHT;
        const appliedTvaRate = itemDto.appliedTvaRate ?? article?.category?.tvaRate ?? 0;

        if (!serviceName || unitPriceHT === undefined || unitPriceHT === null) {
          throw new BadRequestException('Each bid item needs an articleId or custom serviceName and unitPriceHT');
        }

        const documentItem = new DocumentItem({
          serviceName,
          quantity: itemDto.quantity,
          unitPriceHT,
          appliedTvaRate,
          discountAmount: itemDto.discountAmount ?? 0,
          article,
        });
        documentItems.push(documentItem);
      }
    }

    console.log('Document items constructed:', documentItems);

    const bidRepository = this.dataSource.getRepository(Devis);
    const existingBid = await bidRepository.findOne({
      where: {
        workflow: { id: workflowId },
        biddingSeller: { id: dto.sellerCompanyId },
      },
    });
    if (existingBid) {
      throw new ConflictException('This company already has a bid on this workflow');
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

    console.log('Constructed bid:', bid);

    const calculator = new InvoiceCalculatorService();
    calculator.applyTotals(bid);

    await bidRepository.save(bid);

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

    const stockConflicts: string[] = [];

    if (wf.technicalCategory?.toUpperCase() === 'MATERIAL') {
      for (const item of bid.items) {
        if (!item.article) {
          stockConflicts.push(`Bid item "${item.serviceName}" is not linked to a catalog article.`);
          continue;
        }
        const inventoryItem = await this.inventoryRepo.findBySkuAndVendor(item.article.reference, sellerCompanyId);
        if (!inventoryItem) {
          stockConflicts.push(`No inventory record found for SKU "${item.article.reference}".`);
          continue;
        }
        const allocatedQuantity = Math.min(inventoryItem.availableStock, item.quantity);
        if (allocatedQuantity > 0) {
          await this.stockAllocationRepo.save(new StockAllocation({
            quantityAllocated: allocatedQuantity,
            isDispatched: false,
            carrierName: null,
            trackingNumber: null,
            deliverySlipUrl: null,
            estimatedShippingDate: null,
            actualDeliveryDate: null,
            targetItem: inventoryItem,
            workflow: wf,
          }));

          inventoryItem.availableStock -= allocatedQuantity;
          await this.inventoryRepo.save(inventoryItem);
        }

        if (item.quantity > allocatedQuantity) {
          stockConflicts.push(
            `SKU "${item.article.reference}" is short by ${item.quantity - allocatedQuantity} unit(s). Available: ${inventoryItem.availableStock + allocatedQuantity}, Requested: ${item.quantity}`,
          );
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

    // Set accepted bid status
    bid.bidStatus = 'BC_PENDING_VENDOR';

    // Reject all other bids
    for (const otherBid of wf.bids ?? []) {
      if (otherBid.id !== bidId) {
        otherBid.isRejected = true;
        otherBid.bidStatus = 'REJECTED';
        otherBid.rejectionReason = 'Automated: Another bid was accepted.';
      }
    }

    // Auto-generate BonDeCommande
    const bcRepo = this.dataSource.getRepository(BonDeCommande);
    const existingBCCount = await bcRepo.count({ where: { workflow: { id: workflowId } } });
    const sequence = existingBCCount + 1;
    const year = new Date().getFullYear();
    const clientPoRef = `BC-${year}-${workflowId}-${sequence}`;

    const bc = new BonDeCommande({
      referenceNumber: clientPoRef,
      clientPoReferenceNumber: clientPoRef,
      issueDate: new Date(),
      subTotalHT: bid.subTotalHT,
      totalTVA: bid.totalTVA,
      totalTTC: bid.totalTTC,
      deliveryLeadTime: bid.deliveryLeadTime,
      downPaymentPercentage: bid.downPaymentPercentage,
      balanceDueDays: bid.balanceDueDays,
      items: bid.items,
      workflow: wf,
      acceptedDevis: bid,
      filePath: null,
      globalDiscountPercentage: 0,
    });

    if (!wf.documents) wf.documents = [];
    wf.documents.push(bc);

    await this.notificationService.createNotification(
      `BC "${clientPoRef}" generated for Workflow "${wf.title}". Please confirm to establish the contract.`,
      'CREATED',
      actor,
      seller,
    );
    const conflictSuffix = stockConflicts.length
      ? ` Stock conflicts: ${stockConflicts.join(' | ')}`
      : '';

    const savedWorkflow = await this.saveWithHistory(
      wf,
      actor,
      `Bid #${bidId} accepted. BC "${clientPoRef}" generated. Seller: ${seller.name}.${conflictSuffix}`,
    );

    return {
      ...savedWorkflow,
      stockSyncConflicts: stockConflicts,
    } as any;
  }

  async confirmBC(
    workflowId: number,
    actorId: number,
    companyId: number,
    role: SystemRole,
  ): Promise<BusinessWorkflow> {
    const [wf, actor] = await Promise.all([
      this.findOne(workflowId),
      this.userService.findOne(actorId),
    ]);

    // Only the chosen seller company can confirm the BC
    if (role !== SystemRole.PLATFORM_ADMIN && wf.chosenSellerCompany?.id !== companyId) {
      throw new ForbiddenException('Only the chosen seller company or platform admin can confirm the BC');
    }

    // Find the BC document for this workflow
    const bcRepo = this.dataSource.getRepository(BonDeCommande);
    const bc = await bcRepo.findOne({ where: { workflow: { id: workflowId } }, relations: ['acceptedDevis'] });
    if (!bc) {
      throw new NotFoundException(`No BonDeCommande found for workflow #${workflowId}`);
    }

    // Sign the BC
    bc.signatureTimestamp = new Date();

    // Update accepted bid status to CONTRACT_ESTABLISHED
    if (bc.acceptedDevis) {
      bc.acceptedDevis.bidStatus = 'CONTRACT_ESTABLISHED';
    }

    // Update workflow contract fields
    const contractStartDate = new Date();
    wf.contractStartDate = contractStartDate;
    wf.contractStatus = 'ACTIVE';

    // Save atomically
    await this.dataSource.transaction(async (manager) => {
      await manager.save(BonDeCommande, bc);
      if (bc.acceptedDevis) {
        await manager.save(Devis, bc.acceptedDevis);
      }
      await manager.save(BusinessWorkflow, wf);
      const entry = new WorkflowHistory({
        workflow: wf,
        standardStatus: wf.stateCode,
        actor,
        timestamp: new Date(),
        notes: `BC confirmed by seller. Contract established. contractStartDate: ${contractStartDate.toISOString()}`,
      });
      await manager.save(WorkflowHistory, entry);
    });

    // Notify both buyer and seller
    await Promise.all([
      this.notificationService.createNotification(
        `Contract established for Workflow "${wf.title}". BC confirmed by seller.`,
        'VALIDATED',
        actor,
        wf.buyerCompany,
      ),
      this.notificationService.createNotification(
        `Contract established for Workflow "${wf.title}". BC confirmed successfully.`,
        'VALIDATED',
        actor,
        wf.chosenSellerCompany!,
      ),
    ]);

    return wf;
  }

  async rejectBid(
    workflowId: number,
    bidId: number,
    actorId: number,
    companyId: number,
    role: SystemRole,
    rejectionReason?: string,
  ): Promise<Devis> {
    const [wf, actor] = await Promise.all([
      this.findOne(workflowId),
      this.userService.findOne(actorId),
    ]);

    if (role !== SystemRole.PLATFORM_ADMIN && wf.buyerCompany?.id !== companyId) {
      throw new ForbiddenException('Only the buyer company or platform admin can reject bids');
    }

    const bid = wf.bids?.find((b) => b.id === bidId);
    if (!bid) throw new NotFoundException(`Bid #${bidId} not found on workflow #${workflowId}`);

    bid.isRejected = true;
    bid.bidStatus = 'REJECTED';
    bid.rejectionReason = rejectionReason ?? null;

    await this.saveWithHistory(wf, actor, `Bid #${bidId} rejected. Reason: ${rejectionReason ?? 'No reason provided'}`);
    return bid;
  }

  async listBids(
    workflowId: number,
    companyId: number,
    role: SystemRole,
  ): Promise<Devis[]> {
    const wf = await this.findOne(workflowId);

    if (role !== SystemRole.PLATFORM_ADMIN && wf.buyerCompany?.id !== companyId) {
      throw new ForbiddenException('Only the buyer company or platform admin can list bids');
    }

    return wf.bids ?? [];
  }

  async getContractDetail(
    workflowId: number,
    companyId: number,
    role: SystemRole,
  ): Promise<object> {
    const wf = await this.findOne(workflowId);

    const isInvolved =
      wf.buyerCompany?.id === companyId || wf.chosenSellerCompany?.id === companyId;
    if (role !== SystemRole.PLATFORM_ADMIN && !isInvolved) {
      throw new ForbiddenException('You are not involved in this contract');
    }

    const bcRepo = this.dataSource.getRepository(BonDeCommande);
    const bc = await bcRepo.findOne({ where: { workflow: { id: workflowId } } });

    const timelineMap: Record<string, string[]> = {
      material: ['Ordered', 'Packaging', 'Shipping', 'Inspected', 'Invoiced', 'Payment', 'Completed'],
      service: ['Kickoff', 'Development', 'Testing & QA', 'Invoiced', 'Payment', 'Completed'],
      subscription: ['Activated', 'First Billing', 'Recurring', 'Cancelled/Completed'],
    };

    const timeline = wf.workflowType ? (timelineMap[wf.workflowType] ?? []) : [];

    return {
      contractType: wf.workflowType,
      buyerCompany: wf.buyerCompany,
      sellerCompany: wf.chosenSellerCompany,
      value: bc?.totalTTC ?? null,
      contractStartDate: wf.contractStartDate,
      expectedDeliveryDate: wf.expectedDeliveryDate,
      contractStatus: wf.contractStatus,
      conditions: wf.conditions,
      progressStepIndex: wf.progressStepIndex,
      timeline,
      documents: wf.documents ?? [],
    };
  }

  async advanceProgress(
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
      throw new ForbiddenException('Only the chosen seller company or platform admin can advance progress');
    }

    const maxStepsMap: Record<string, number> = {
      material: 7,
      service: 6,
      subscription: 4,
    };
    const maxSteps = wf.workflowType ? (maxStepsMap[wf.workflowType] ?? 0) : 0;

    if (wf.progressStepIndex >= maxSteps) {
      throw new BadRequestException('Contract progress is already at the final step');
    }

    wf.progressStepIndex += 1;
    return this.saveWithHistory(wf, actor, `Contract progress advanced to step ${wf.progressStepIndex}`);
  }

  async listContracts(companyId: number, role: SystemRole): Promise<BusinessWorkflow[]> {
    const workflows = await this.workflowRepo.findAll();
    const contractStates = [WorkflowStatus.IN_PROGRESS, WorkflowStatus.UNDER_TEST, WorkflowStatus.FULLY_INVOICED];

    return workflows.filter((w) => {
      if (!contractStates.includes(w.stateCode)) return false;
      if (role === SystemRole.PLATFORM_ADMIN) return true;
      return w.buyerCompany?.id === companyId || w.chosenSellerCompany?.id === companyId;
    });
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

      return this.toPlainWorkflow(savedWf);
    });
  }

  private toPlainWorkflow(workflow: BusinessWorkflow): BusinessWorkflow {
    const seen = new WeakSet<object>();
    return JSON.parse(
      JSON.stringify(workflow, (_key, value) => {
        if (value && typeof value === 'object') {
          if (seen.has(value)) {
            return undefined;
          }
          seen.add(value);
        }
        return value;
      }),
    ) as BusinessWorkflow;
  }
}
