import {
  Controller, Get, Post, Patch, Param, Body, ParseIntPipe, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery,
} from '@nestjs/swagger';
import { BusinessWorkflowService } from './business-workflow.service.js';
import { BusinessWorkflow } from './business-workflow.entity.js';
import { WorkflowHistory } from '../history/workflow-history.entity.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { SystemRole } from '../../identity/enum/system-role.enum.js';
import { Devis } from '../../finance/devis/devis.entity.js';
import {
  CreateWorkflowDto,
  SubmitBidDto,
  AcceptBidDto,
  RecordTestOutcomeDto,
  BidItemDto,
} from './dto/index.js';

@ApiTags('Workflows')
@ApiBearerAuth()
@Controller('workflows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessWorkflowController {
  constructor(private readonly workflowService: BusinessWorkflowService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all workflows',
    description: 'Retrieve all workflows accessible to the authenticated user',
  })
  @ApiQuery({ name: 'mine', required: false, type: Boolean, description: 'When true, return only workflows where the user is the buyer' })
  @ApiResponse({
    status: 200,
    description: 'List of workflows retrieved successfully',
    type: [BusinessWorkflow],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() user: any,
    @Query('mine') mine?: string,
  ): Promise<BusinessWorkflow[]> {
    return this.workflowService.findAll(user, mine === 'true');
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active public tenders',
    description: 'Retrieve all active public tenders available for bidding',
  })
  @ApiQuery({ name: 'technicalCategory', required: false, type: String })
  @ApiQuery({ name: 'budgetCeiling', required: false, type: Number })
  @ApiQuery({ name: 'region', required: false, type: String })
  @ApiQuery({ name: 'createdAfter', required: false, type: String, description: 'ISO date string' })
  @ApiResponse({
    status: 200,
    description: 'List of active tenders',
    type: [BusinessWorkflow],
  })
  findActive(
    @Query('technicalCategory') technicalCategory?: string,
    @Query('budgetCeiling') budgetCeiling?: string,
    @Query('region') region?: string,
    @Query('createdAfter') createdAfter?: string,
  ): Promise<BusinessWorkflow[]> {
    return this.workflowService.findActivePublicTenders({
      technicalCategory,
      budgetCeiling: budgetCeiling !== undefined ? Number(budgetCeiling) : undefined,
      region,
      createdAfter,
    });
  }

  @Get('contracts')
  @ApiOperation({
    summary: 'List contracts',
    description: 'Return all workflows in contract states (IN_PROGRESS, UNDER_TEST, FULLY_INVOICED) for the current user\'s company',
  })
  @ApiResponse({
    status: 200,
    description: 'List of contracts',
    type: [BusinessWorkflow],
  })
  listContracts(@CurrentUser() user: any): Promise<BusinessWorkflow[]> {
    return this.workflowService.listContracts(user.companyId, user.role);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get workflow by ID',
    description: 'Retrieve a specific workflow by its ID',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Workflow ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow retrieved successfully',
    type: BusinessWorkflow,
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.findOne(id, user);
  }

  @Get(':id/history')
  @ApiOperation({
    summary: 'Get workflow history',
    description: 'Retrieve the complete history of a workflow including all state transitions',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Workflow ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow history retrieved successfully',
    type: [WorkflowHistory],
  })
  async getHistory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<WorkflowHistory[]> {
    await this.workflowService.findOne(id, user); // Enforces view authorization check
    return this.workflowService.findHistory(id);
  }

  @Get(':id/bids')
  @ApiOperation({
    summary: 'List bids for a workflow',
    description: 'Return all bids submitted to a workflow. Only accessible by the buyer company or platform admin.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'List of bids', type: [Devis] })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  listBids(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<Devis[]> {
    return this.workflowService.listBids(id, user.companyId, user.role);
  }

  @Get(':id/contract')
  @ApiOperation({
    summary: 'Get contract detail',
    description: 'Return full contract detail for a workflow. Only accessible by involved companies or platform admin.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Contract detail' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getContractDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<object> {
    return this.workflowService.getContractDetail(id, user.companyId, user.role);
  }

  @Post(':id/bids/:bidId/reject')
  @ApiOperation({
    summary: 'Reject a bid',
    description: 'Reject a specific bid on a workflow. Only the buyer company or platform admin can reject bids.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Workflow ID' })
  @ApiParam({ name: 'bidId', type: 'number', description: 'Bid ID' })
  @ApiBody({ schema: { properties: { rejectionReason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Bid rejected successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Bid not found' })
  rejectBid(
    @Param('id', ParseIntPipe) id: number,
    @Param('bidId', ParseIntPipe) bidId: number,
    @Body() body: { rejectionReason?: string },
    @CurrentUser() user: any,
  ): Promise<Devis> {
    return this.workflowService.rejectBid(id, bidId, user.userId, user.companyId, user.role, body.rejectionReason);
  }

  @Post(':id/bc/confirm')
  @ApiOperation({
    summary: 'Confirm the Bon de Commande',
    description: 'Seller confirms the BC to establish the contract. Only the chosen seller company or platform admin can confirm.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'BC confirmed and contract established', type: BusinessWorkflow })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'BC not found' })
  confirmBC(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.confirmBC(id, user.userId, user.companyId, user.role);
  }

  @Patch(':id/contract/progress')
  @ApiOperation({
    summary: 'Advance contract progress',
    description: 'Increment the contract progress step. Only the chosen seller company or platform admin can advance progress.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Progress advanced', type: BusinessWorkflow })
  @ApiResponse({ status: 400, description: 'Already at final step' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  advanceProgress(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.advanceProgress(id, user.userId, user.companyId, user.role);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new workflow',
    description: 'Create a new procurement workflow (RFQ/RFP)',
  })
  @ApiBody({
    type: CreateWorkflowDto,
    description: 'Workflow creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Workflow created successfully',
    type: BusinessWorkflow,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
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
  @ApiOperation({
    summary: 'Publish a workflow',
    description: 'Publish a workflow to make it visible and available for bidding',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Workflow ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow published successfully',
    type: BusinessWorkflow,
  })
  publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.publish(id, user.userId, user.companyId, user.role);
  }

  @Post(':id/bids')
  @ApiOperation({
    summary: 'Submit a bid to a workflow',
    description: 'Submit a vendor bid with items and terms for a published workflow',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Workflow ID',
    example: 1,
  })
  @ApiBody({
    type: SubmitBidDto,
    description: 'Bid submission data',
  })
  @ApiResponse({
    status: 200,
    description: 'Bid submitted successfully',
    type: BusinessWorkflow,
  })
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
  @ApiOperation({
    summary: 'Accept a bid',
    description: 'Accept a vendor bid and move workflow to the acceptance stage',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Workflow ID',
    example: 1,
  })
  @ApiBody({
    type: AcceptBidDto,
    description: 'Bid acceptance data',
  })
  @ApiResponse({
    status: 200,
    description: 'Bid accepted successfully',
    type: BusinessWorkflow,
  })
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
  @ApiOperation({
    summary: 'Start testing phase',
    description: 'Move workflow to testing/reception phase',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Workflow ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow moved to testing phase',
    type: BusinessWorkflow,
  })
  completeAndTest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.completeAndTest(id, user.userId, user.companyId, user.role);
  }

  @Post(':id/test-outcome')
  @ApiOperation({
    summary: 'Record test/reception outcome',
    description: 'Record the result of quality testing or product reception',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Workflow ID',
    example: 1,
  })
  @ApiBody({
    type: RecordTestOutcomeDto,
    description: 'Test outcome data',
  })
  @ApiResponse({
    status: 200,
    description: 'Test outcome recorded successfully',
    type: BusinessWorkflow,
  })
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
  @ApiOperation({
    summary: 'Create invoice',
    description: 'Generate invoice after successful testing/reception',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Workflow ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice created successfully',
    type: BusinessWorkflow,
  })
  fullyInvoice(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<BusinessWorkflow> {
    return this.workflowService.fullyInvoice(id, user.userId, user.companyId, user.role);
  }
}
