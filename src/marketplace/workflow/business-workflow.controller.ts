import {
  Controller, Get, Post, Param, Body, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { BusinessWorkflowService } from './business-workflow.service.js';
import { BusinessWorkflow } from './business-workflow.entity.js';
import { WorkflowHistory } from '../history/workflow-history.entity.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { SystemRole } from '../../identity/enum/system-role.enum.js';

interface CreateWorkflowDto {
  title: string;
  description: string;
  budgetCeiling: number;
  buyerCompanyId?: number;
  technicalCategory?: string;
  submissionDeadline?: string;
  expectedDeliveryDate?: string;
  currency?: string;
  rfpFileUrl?: string;
}

interface BidItemDto {
  articleId: number;
  quantity: number;
  discountAmount?: number;
}

interface SubmitBidDto {
  referenceNumber: string;
  issueDate: string;
  validUntil: string;
  sellerCompanyId?: number;
  deliveryLeadTime?: number;
  downPaymentPercentage?: number;
  balanceDueDays?: number;
  revisionNumber?: number;
  vendorNotes?: string;
  technicalProposalFileUrl?: string;
  financialQuoteFileUrl?: string;
  items?: BidItemDto[];
}

interface AcceptBidDto {
  bidId: number;
  sellerCompanyId: number;
}

interface RecordTestOutcomeDto {
  isAccepted: boolean;
  testDate?: string;
  testerName?: string;
  rejectionReason?: string;
  pvRecetteFileUrl?: string;
}

@Controller('workflows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessWorkflowController {
  constructor(private readonly workflowService: BusinessWorkflowService) {}

  @Get()
  findAll(@CurrentUser() user: any): Promise<BusinessWorkflow[]> {
    return this.workflowService.findAll(user);
  }

  @Get('active')
  findActive(): Promise<BusinessWorkflow[]> {
    return this.workflowService.findActivePublicTenders();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.findOne(id, user);
  }

  @Get(':id/history')
  async getHistory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<WorkflowHistory[]> {
    await this.workflowService.findOne(id, user); // Enforces view authorization check
    return this.workflowService.findHistory(id);
  }

  @Post()
  create(
    @Body() dto: CreateWorkflowDto,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    const buyerCompanyId =
      user.role === SystemRole.PLATFORM_ADMIN
        ? (dto.buyerCompanyId ?? user.companyId)
        : user.companyId;

    if (!buyerCompanyId) {
      throw new Error('Buyer company ID is required');
    }

    return this.workflowService.create({
      ...dto,
      buyerCompanyId,
    });
  }

  @Post(':id/publish')
  publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.publish(id, user.userId, user.companyId, user.role);
  }

  @Post(':id/bids')
  submitBid(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitBidDto,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    const sellerCompanyId =
      user.role === SystemRole.PLATFORM_ADMIN
        ? (dto.sellerCompanyId ?? user.companyId)
        : user.companyId;

    if (!sellerCompanyId) {
      throw new Error('Seller company ID is required');
    }

    return this.workflowService.submitBid(id, user.userId, user.companyId, user.role, {
      ...dto,
      sellerCompanyId,
      issueDate: new Date(dto.issueDate),
      validUntil: new Date(dto.validUntil),
    });
  }

  @Post(':id/bids/accept')
  acceptBid(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AcceptBidDto,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.acceptBid(
      id,
      user.userId,
      user.companyId,
      user.role,
      dto.bidId,
      dto.sellerCompanyId,
    );
  }

  @Post(':id/complete-testing')
  completeAndTest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.completeAndTest(id, user.userId, user.companyId, user.role);
  }

  @Post(':id/test-outcome')
  recordTestOutcome(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordTestOutcomeDto,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.recordTestOutcome(id, user.userId, user.companyId, user.role, {
      ...dto,
      testDate: dto.testDate ? new Date(dto.testDate) : undefined,
    });
  }

  @Post(':id/invoice')
  fullyInvoice(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.fullyInvoice(id, user.userId, user.companyId, user.role);
  }
}
