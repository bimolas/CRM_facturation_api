import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { BidService } from './bid.service.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';

@ApiTags('Bids')
@ApiBearerAuth()
@Controller('bids')
export class BidController {
  constructor(private readonly bidService: BidService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Get all bids submitted by the authenticated company' })
  @ApiResponse({ status: 200, description: 'List of bids' })
  getMyBids(@CurrentUser() user: any): Promise<object[]> {
    return this.bidService.getMyBids(user.companyId);
  }

  @Get(':bidId')
  @ApiOperation({ summary: 'Get full bid detail with negotiation thread' })
  @ApiParam({ name: 'bidId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Bid detail with negotiation thread' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getBidDetail(
    @Param('bidId', ParseIntPipe) bidId: number,
    @CurrentUser() user: any,
  ): Promise<object> {
    return this.bidService.getBidDetail(bidId, user.companyId);
  }
}
