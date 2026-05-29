import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkItem } from './work-item.entity.js';
import { Task } from '../task/task.entity.js';
import { PaymentInstallment } from '../payment/payment-installment.entity.js';
import { BusinessWorkflow } from '../../marketplace/workflow/business-workflow.entity.js';
import { Team } from '../../teams/team.entity.js';
import { WorkItemStatusService } from '../../domain-services/work-item-status.service.js';
import { PaymentScheduleService } from '../../domain-services/payment-schedule.service.js';
import { NotificationService } from '../../notification/notification.service.js';
import { WorkflowStatus } from '../../marketplace/enum/workflow-status.enum.js';

@Injectable()
export class WorkItemService {
  constructor(
    @InjectRepository(WorkItem)
    private readonly workItemRepo: Repository<WorkItem>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(PaymentInstallment)
    private readonly installmentRepo: Repository<PaymentInstallment>,
    @InjectRepository(BusinessWorkflow)
    private readonly workflowRepo: Repository<BusinessWorkflow>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    private readonly workItemStatusService: WorkItemStatusService,
    private readonly paymentScheduleService: PaymentScheduleService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    workflowId: number,
    dto: {
      title: string;
      description: string;
      type: 'material' | 'service' | 'subscription';
      startDate: Date;
      endDate: Date;
      monthlyAmount?: number;
      assignedTeamId?: number;
    },
    actorCompanyId: number,
  ): Promise<WorkItem> {
    const workflow = await this.workflowRepo.findOne({
      where: { id: workflowId },
      relations: ['buyerCompany', 'chosenSellerCompany'],
    });
    if (!workflow) throw new NotFoundException(`Workflow #${workflowId} not found`);

    if (workflow.stateCode !== WorkflowStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Workflow #${workflowId} is not IN_PROGRESS (current state: ${workflow.stateCode})`,
      );
    }

    let assignedTeam: Team | null = null;
    if (dto.assignedTeamId) {
      const team = await this.teamRepo.findOne({
        where: { id: dto.assignedTeamId },
        relations: ['company'],
      });
      if (!team) throw new NotFoundException(`Team #${dto.assignedTeamId} not found`);
      if (team.company.id !== actorCompanyId) {
        throw new BadRequestException(
          `Team #${dto.assignedTeamId} does not belong to your company`,
        );
      }
      assignedTeam = team;
    }

    const workItem = this.workItemRepo.create({
      workflow,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      monthlyAmount: dto.monthlyAmount ?? null,
      assignedTeam,
      status: 'PENDING',
    });

    const saved = await this.workItemRepo.save(workItem);

    // Generate payment schedule for subscription type
    if (
      dto.type === 'subscription' &&
      dto.monthlyAmount &&
      dto.startDate &&
      dto.endDate
    ) {
      const schedule = this.paymentScheduleService.generate(
        new Date(dto.startDate),
        new Date(dto.endDate),
        dto.monthlyAmount,
      );
      const installments = schedule.map((entry) =>
        this.installmentRepo.create({
          workItem: saved,
          dueDate: entry.dueDate,
          amount: entry.amount,
          status: 'PENDING',
        }),
      );
      await this.installmentRepo.save(installments);
    }

    // Notify buyer company
    if (workflow.buyerCompany) {
      await this.notificationService.createNotification(
        `New work item "${saved.title}" created for workflow "${workflow.title}".`,
        'WORK_ITEM',
        undefined,
        workflow.buyerCompany,
      );
    }

    return saved;
  }

  async findAll(workflowId: number): Promise<WorkItem[]> {
    return this.workItemRepo.find({
      where: { workflow: { id: workflowId } },
      relations: ['tasks', 'assignedTeam'],
    });
  }

  async findOne(workItemId: number): Promise<WorkItem> {
    const workItem = await this.workItemRepo.findOne({
      where: { id: workItemId },
      relations: ['tasks', 'assignedTeam', 'workflow'],
    });
    if (!workItem) throw new NotFoundException(`WorkItem #${workItemId} not found`);
    return workItem;
  }

  async update(
    workItemId: number,
    dto: Partial<{
      title: string;
      description: string;
      startDate: Date;
      endDate: Date;
      monthlyAmount: number;
      assignedTeamId: number | null;
    }>,
    actorCompanyId: number,
  ): Promise<WorkItem> {
    const workItem = await this.findOne(workItemId);

    if (dto.title !== undefined) workItem.title = dto.title;
    if (dto.description !== undefined) workItem.description = dto.description;
    if (dto.startDate !== undefined) workItem.startDate = dto.startDate;
    if (dto.endDate !== undefined) workItem.endDate = dto.endDate;
    if (dto.monthlyAmount !== undefined) workItem.monthlyAmount = dto.monthlyAmount;

    if (dto.assignedTeamId !== undefined) {
      if (dto.assignedTeamId === null) {
        workItem.assignedTeam = null;
      } else {
        const team = await this.teamRepo.findOne({
          where: { id: dto.assignedTeamId },
          relations: ['company'],
        });
        if (!team) throw new NotFoundException(`Team #${dto.assignedTeamId} not found`);
        if (team.company.id !== actorCompanyId) {
          throw new BadRequestException(
            `Team #${dto.assignedTeamId} does not belong to your company`,
          );
        }
        workItem.assignedTeam = team;
      }
    }

    return this.workItemRepo.save(workItem);
  }

  async addTask(
    workItemId: number,
    dto: {
      title: string;
      description?: string;
      status?: 'todo' | 'in-progress' | 'completed';
      dueDate?: Date;
      durationDays?: number;
    },
  ): Promise<Task> {
    const workItem = await this.findOne(workItemId);

    const task = this.taskRepo.create({
      workItem,
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status ?? 'todo',
      dueDate: dto.dueDate ?? null,
      durationDays: dto.durationDays ?? 1,
      comments: [],
      attachments: [],
    });

    const saved = await this.taskRepo.save(task);
    await this.recomputeStatus(workItemId);
    return saved;
  }

  async updateTask(
    workItemId: number,
    taskId: number,
    dto: Partial<{
      title: string;
      description: string;
      status: 'todo' | 'in-progress' | 'completed';
      dueDate: Date;
      durationDays: number;
    }>,
  ): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, workItem: { id: workItemId } },
    });
    if (!task) throw new NotFoundException(`Task #${taskId} not found on WorkItem #${workItemId}`);

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate;
    if (dto.durationDays !== undefined) task.durationDays = dto.durationDays;

    const saved = await this.taskRepo.save(task);
    await this.recomputeStatus(workItemId);
    return saved;
  }

  async deleteTask(workItemId: number, taskId: number): Promise<void> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, workItem: { id: workItemId } },
    });
    if (!task) throw new NotFoundException(`Task #${taskId} not found on WorkItem #${workItemId}`);

    await this.taskRepo.remove(task);
    await this.recomputeStatus(workItemId);
  }

  async listTasks(workItemId: number): Promise<{
    todo: Task[];
    'in-progress': Task[];
    completed: Task[];
  }> {
    const tasks = await this.taskRepo.find({
      where: { workItem: { id: workItemId } },
      order: { createdAt: 'ASC' },
    });

    return {
      todo: tasks.filter((t) => t.status === 'todo'),
      'in-progress': tasks.filter((t) => t.status === 'in-progress'),
      completed: tasks.filter((t) => t.status === 'completed'),
    };
  }

  async addComment(
    workItemId: number,
    taskId: number,
    authorName: string,
    text: string,
  ): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, workItem: { id: workItemId } },
    });
    if (!task) throw new NotFoundException(`Task #${taskId} not found on WorkItem #${workItemId}`);

    const comment = {
      author: authorName,
      text,
      timestamp: new Date().toISOString(),
    };

    task.comments = [...(task.comments ?? []), comment];
    return this.taskRepo.save(task);
  }

  async getPaymentSchedule(workItemId: number): Promise<PaymentInstallment[]> {
    const installments = await this.installmentRepo.find({
      where: { workItem: { id: workItemId } },
      order: { dueDate: 'ASC' },
    });

    const now = new Date();
    let hasChanges = false;

    for (const installment of installments) {
      if (
        installment.status === 'PENDING' &&
        new Date(installment.dueDate) < now
      ) {
        installment.status = 'OVERDUE';
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await this.installmentRepo.save(installments);
    }

    return installments;
  }

  async markInstallmentPaid(
    workItemId: number,
    installmentId: number,
    paidAt: Date,
  ): Promise<PaymentInstallment> {
    const installment = await this.installmentRepo.findOne({
      where: { id: installmentId, workItem: { id: workItemId } },
    });
    if (!installment) {
      throw new NotFoundException(
        `Installment #${installmentId} not found for WorkItem #${workItemId}`,
      );
    }

    installment.status = 'PAID';
    installment.paidAt = paidAt;
    return this.installmentRepo.save(installment);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async recomputeStatus(workItemId: number): Promise<void> {
    const workItem = await this.workItemRepo.findOne({
      where: { id: workItemId },
    });
    if (!workItem) return;

    const tasks = await this.taskRepo.find({
      where: { workItem: { id: workItemId } },
    });

    workItem.status = this.workItemStatusService.derive(tasks);
    await this.workItemRepo.save(workItem);
  }
}
