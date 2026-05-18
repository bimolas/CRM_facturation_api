import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateWorkflowDto {
  @ApiProperty({
    description: 'Workflow title',
    example: 'Supply Request for Office Equipment',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Workflow description',
    example: 'Request for quotes on office equipment needed for Q2 2026',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Maximum budget for the workflow',
    example: 50000,
  })
  @IsNumber()
  budgetCeiling: number;

  @ApiPropertyOptional({
    description: 'Buyer company ID (auto-set for non-admins)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  buyerCompanyId?: number;

  @ApiPropertyOptional({
    description: 'Technical category of the request',
    example: 'Office Equipment',
  })
  @IsOptional()
  @IsString()
  technicalCategory?: string;

  @ApiPropertyOptional({
    description: 'Submission deadline in ISO format',
    example: '2026-06-18T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  submissionDeadline?: string;

  @ApiPropertyOptional({
    description: 'Expected delivery date in ISO format',
    example: '2026-07-15T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({
    description: 'Currency for the workflow',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'URL to RFP (Request for Proposal) file',
    example: 'https://example.com/documents/rfp.pdf',
  })
  @IsOptional()
  @IsString()
  rfpFileUrl?: string;
}

export class BidItemDto {
  @ApiProperty({
    description: 'Article ID for the bid item',
    example: 5,
  })
  @IsNumber()
  articleId: number;

  @ApiProperty({
    description: 'Quantity of the article',
    example: 10,
  })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Discount amount for this item',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;
}

export class SubmitBidDto {
  @ApiProperty({
    description: 'Bid reference number',
    example: 'BID-2026-0001',
  })
  @IsString()
  referenceNumber: string;

  @ApiProperty({
    description: 'Issue date in ISO format',
    example: '2026-05-18T10:30:00Z',
  })
  @IsString()
  issueDate: string;

  @ApiProperty({
    description: 'Valid until date in ISO format',
    example: '2026-06-18T23:59:59Z',
  })
  @IsString()
  validUntil: string;

  @ApiPropertyOptional({
    description: 'Seller company ID',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  sellerCompanyId?: number;

  @ApiPropertyOptional({
    description: 'Delivery lead time in days',
    example: 14,
  })
  @IsOptional()
  @IsNumber()
  deliveryLeadTime?: number;

  @ApiPropertyOptional({
    description: 'Down payment percentage',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  downPaymentPercentage?: number;

  @ApiPropertyOptional({
    description: 'Balance due in days',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  balanceDueDays?: number;

  @ApiPropertyOptional({
    description: 'Revision number',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  revisionNumber?: number;

  @ApiPropertyOptional({
    description: 'Additional notes from vendor',
    example: 'Standard delivery available',
  })
  @IsOptional()
  @IsString()
  vendorNotes?: string;

  @ApiPropertyOptional({
    description: 'URL to technical proposal file',
    example: 'https://example.com/technical-proposal.pdf',
  })
  @IsOptional()
  @IsString()
  technicalProposalFileUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to financial quote file',
    example: 'https://example.com/quote.pdf',
  })
  @IsOptional()
  @IsString()
  financialQuoteFileUrl?: string;

  @ApiPropertyOptional({
    description: 'Array of bid items',
    type: [BidItemDto],
  })
  @IsOptional()
  items?: BidItemDto[];
}

export class AcceptBidDto {
  @ApiProperty({
    description: 'ID of the bid to accept',
    example: 1,
  })
  @IsNumber()
  bidId: number;

  @ApiProperty({
    description: 'Seller company ID',
    example: 2,
  })
  @IsNumber()
  sellerCompanyId: number;
}

export class RecordTestOutcomeDto {
  @ApiProperty({
    description: 'Whether the test was accepted',
    example: true,
  })
  isAccepted: boolean;

  @ApiPropertyOptional({
    description: 'Test date in ISO format',
    example: '2026-05-20T14:00:00Z',
  })
  @IsOptional()
  @IsString()
  testDate?: string;

  @ApiPropertyOptional({
    description: 'Name of the tester',
    example: 'John Smith',
  })
  @IsOptional()
  @IsString()
  testerName?: string;

  @ApiPropertyOptional({
    description: 'Reason for rejection if applicable',
    example: 'Product does not meet specifications',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'URL to PV Recette (acceptance report) file',
    example: 'https://example.com/pv-recette.pdf',
  })
  @IsOptional()
  @IsString()
  pvRecetteFileUrl?: string;
}
