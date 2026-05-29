import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { Task } from '../task/task.entity.js';
import { PaymentInstallment } from '../payment/payment-installment.entity.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';

// ─── /works routes ────────────────────────────────────────────────────────────

@ApiTags('Work Items')
@ApiBearerAuth()
@Controller('works')
export class WorkItemController {
  constructor(private readonly workItemService: WorkItemService) {}

  @Get(':workId')
  @ApiOperation({ summary: 'Get a work item by ID' })
  @ApiParam({ name: 'workId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Work item found', type: WorkItem })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('workId', ParseIntPipe) workId: number): Promise<WorkItem> {
    return this.workItemService.findOne(workId);
  }

  @Patch(':workId')
  @ApiOperation({ summary: 'Update a work item' })
  @ApiParam({ name: 'workId', type: 'number' })
  @ApiBody({
    schema: {
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        monthlyAmount: { type: 'number' },
        assignedTeamId: { type: 'number', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Work item updated', type: WorkItem })
  update(
    @Param('workId', ParseIntPipe) workId: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ): Promise<WorkItem> {
    return this.workItemService.update(workId, body, user.companyId);
  }

  // ─── Tasks ────────────────────────────────────────────────────────────────

  @Post(':workId/tasks')
  @ApiOperation({ summary: 'Add a task to a work item' })
  @ApiParam({ name: 'workId', type: 'number' })
  @ApiBody({
    schema: {
      required: ['title'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'completed'] },
        dueDate: { type: 'string', format: 'date' },
        durationDays: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Task created', type: Task })
  addTask(
    @Param('workId', ParseIntPipe) workId: number,
    @Body() body: any,
  ): Promise<Task> {
    return this.workItemService.addTask(workId, body);
  }

  @Get(':workId/tasks')
  @ApiOperation({ summary: 'List tasks grouped by status' })
  @ApiParam({ name: 'workId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Tasks grouped by status',
    schema: {
      properties: {
        todo: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
        'in-progress': { type: 'array', items: { $ref: '#/components/schemas/Task' } },
        completed: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
      },
    },
  })
  listTasks(
    @Param('workId', ParseIntPipe) workId: number,
  ): Promise<{ todo: Task[]; 'in-progress': Task[]; completed: Task[] }> {
    return this.workItemService.listTasks(workId);
  }

  @Patch(':workId/tasks/:taskId')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'workId', type: 'number' })
  @ApiParam({ name: 'taskId', type: 'number' })
  @ApiBody({
    schema: {
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'completed'] },
        dueDate: { type: 'string', format: 'date' },
        durationDays: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Task updated', type: Task })
  updateTask(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() body: any,
  ): Promise<Task> {
    return this.workItemService.updateTask(workId, taskId, body);
  }

  @Delete(':workId/tasks/:taskId')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'workId', type: 'number' })
  @ApiParam({ name: 'taskId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  deleteTask(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<void> {
    return this.workItemService.deleteTask(workId, taskId);
  }

  @Post(':workId/tasks/:taskId/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiParam({ name: 'workId', type: 'number' })
  @ApiParam({ name: 'taskId', type: 'number' })
  @ApiBody({
    schema: {
      required: ['text'],
      properties: {
        text: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Comment added', type: Task })
  addComment(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() body: { text: string },
    @CurrentUser() user: any,
  ): Promise<Task> {
    const authorName: string = user.name ?? user.email ?? `User #${user.userId}`;
    return this.workItemService.addComment(workId, taskId, authorName, body.text);
  }

  // ─── Payment Schedule ─────────────────────────────────────────────────────

  @Get(':workId/payment-schedule')
  @ApiOperation({ summary: 'Get payment schedule for a work item' })
  @ApiParam({ name: 'workId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Payment installments', type: [PaymentInstallment] })
  getPaymentSchedule(
    @Param('workId', ParseIntPipe) workId: number,
  ): Promise<PaymentInstallment[]> {
    return this.workItemService.getPaymentSchedule(workId);
  }

  @Patch(':workId/payment-schedule/:installmentId')
  @ApiOperation({ summary: 'Mark a payment installment as paid' })
  @ApiParam({ name: 'workId', type: 'number' })
  @ApiParam({ name: 'installmentId', type: 'number' })
  @ApiBody({
    schema: {
      required: ['paidAt'],
      properties: {
        paidAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Installment marked as paid', type: PaymentInstallment })
  markInstallmentPaid(
    @Param('workId', ParseIntPipe) workId: number,
    @Param('installmentId', ParseIntPipe) installmentId: number,
    @Body() body: { paidAt: string },
  ): Promise<PaymentInstallment> {
    return this.workItemService.markInstallmentPaid(workId, installmentId, new Date(body.paidAt));
  }
}
