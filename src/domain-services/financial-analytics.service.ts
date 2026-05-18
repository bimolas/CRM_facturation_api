import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WorkflowStatus } from '../marketplace/enum/workflow-status.enum.js';

export interface GrossRevenueResult {
  companyId: number;
  companyName: string;
  totalRevenueTTC: number;
  invoicedWorkflows: number;
}

export interface ProjectMarginResult {
  workflowId: number;
  workflowTitle: string;
  budgetCeiling: number;
  totalRevenueTTC: number;
  marginAmount: number;
  marginPercent: number | null;
}

@Injectable()
export class FinancialAnalyticsEngine {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Real-time gross revenue: sums TTC of all FULLY_INVOICED workflows
   * where the company is the chosen seller.
   */
  async calculateGrossRevenue(companyId: number): Promise<GrossRevenueResult> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('c.id', 'companyId')
      .addSelect('c.name', 'companyName')
      .addSelect('COALESCE(SUM(fd.total_ttc), 0)', 'totalRevenueTTC')
      .addSelect('COUNT(DISTINCT bw.id)', 'invoicedWorkflows')
      .from('companies', 'c')
      .leftJoin(
        'business_workflows',
        'bw',
        'bw.chosen_seller_company_id = c.id AND bw.state_code = :status',
        { status: WorkflowStatus.FULLY_INVOICED },
      )
      .leftJoin('financial_documents', 'fd', 'fd.workflow_id = bw.id')
      .where('c.id = :companyId', { companyId })
      .groupBy('c.id')
      .getRawOne<GrossRevenueResult>();

    return result ?? {
      companyId,
      companyName: '',
      totalRevenueTTC: 0,
      invoicedWorkflows: 0,
    };
  }

  /**
   * Project margin: (TTC revenue - budget ceiling) / budget ceiling × 100.
   */
  async evaluateProjectMargin(workflowId: number): Promise<ProjectMarginResult> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('bw.id', 'workflowId')
      .addSelect('bw.title', 'workflowTitle')
      .addSelect('bw.budget_ceiling', 'budgetCeiling')
      .addSelect('COALESCE(SUM(fd.total_ttc), 0)', 'totalRevenueTTC')
      .from('business_workflows', 'bw')
      .leftJoin('financial_documents', 'fd', 'fd.workflow_id = bw.id')
      .where('bw.id = :workflowId', { workflowId })
      .groupBy('bw.id')
      .getRawOne<{
        workflowId: number;
        workflowTitle: string;
        budgetCeiling: number;
        totalRevenueTTC: number;
      }>();

    if (!result) throw new Error(`Workflow #${workflowId} not found`);

    const marginAmount = Number(result.totalRevenueTTC) - Number(result.budgetCeiling);
    const marginPercent =
      Number(result.budgetCeiling) > 0
        ? (marginAmount / Number(result.budgetCeiling)) * 100
        : null;

    return { ...result, marginAmount, marginPercent };
  }
}
