import {
  Controller, Get, Post, Param, Body, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody,
} from '@nestjs/swagger';
import { BusinessWorkflowService } from './business-workflow.service.js';
import { BusinessWorkflow } from './business-workflow.entity.js';
import { WorkflowHistory } from '../history/workflow-history.entity.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { SystemRole } from '../../identity/enum/system-role.enum.js';
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
//@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessWorkflowController {
  constructor(private readonly workflowService: BusinessWorkflowService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all workflows',
    description: 'Retrieve all workflows accessible to the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of workflows retrieved successfully',
    type: [BusinessWorkflow],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: any): Promise<BusinessWorkflow[]> {
    return this.workflowService.findAll(user);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active public tenders',
    description: 'Retrieve all active public tenders available for bidding',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active tenders',
    type: [BusinessWorkflow],
  })
  findActive(): Promise<BusinessWorkflow[]> {
    return this.workflowService.findActivePublicTenders();
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
