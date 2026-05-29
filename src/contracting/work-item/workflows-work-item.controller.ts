import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { WorkItemService } from './work-item.service.js';
import { WorkItem } from './work-item.entity.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';

// ─── /workflows/:id/works routes ─────────────────────────────────────────────

@ApiTags('Work Items')
@ApiBearerAuth()
@Controller('workflows')
export class WorkflowsWorkItemController {
  constructor(private readonly workItemService: WorkItemService) {}

  @Post(':id/works')
  @ApiOperation({ summary: 'Create a work item for a workflow' })
  @ApiParam({ name: 'id', type: 'number', description: 'Workflow ID' })
  @ApiBody({
    schema: {
      required: ['title', 'description', 'type', 'startDate', 'endDate'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', enum: ['material', 'service', 'subscription'] },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        monthlyAmount: { type: 'number' },
        assignedTeamId: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Work item created', type: WorkItem })
  @ApiResponse({ status: 400, description: 'Workflow not IN_PROGRESS or team mismatch' })
  create(
    @Param('id', ParseIntPipe) workflowId: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ): Promise<WorkItem> {
    return this.workItemService.create(workflowId, body, user.companyId);
  }

  @Get(':id/works')
  @ApiOperation({ summary: 'List all work items for a workflow' })
  @ApiParam({ name: 'id', type: 'number', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Work items list', type: [WorkItem] })
  findAll(@Param('id', ParseIntPipe) workflowId: number): Promise<WorkItem[]> {
    return this.workItemService.findAll(workflowId);
  }
}
