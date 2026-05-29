import { Controller, Post, Get, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { NegotiationService } from './negotiation.service.js';
import { NegotiationMessage } from './negotiation-message.entity.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';

@ApiTags('Negotiation')
@ApiBearerAuth()
@Controller('workflows')
export class NegotiationController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @Post(':id/bids/:bidId/messages')
  @ApiOperation({ summary: 'Send a negotiation message on a bid' })
  @ApiParam({ name: 'id', type: 'number', description: 'Workflow ID' })
  @ApiParam({ name: 'bidId', type: 'number', description: 'Bid ID' })
  @ApiBody({ schema: { properties: { content: { type: 'string' } }, required: ['content'] } })
  @ApiResponse({ status: 201, description: 'Message sent', type: NegotiationMessage })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  sendMessage(
    @Param('id', ParseIntPipe) workflowId: number,
    @Param('bidId', ParseIntPipe) bidId: number,
    @Body() body: { content: string },
    @CurrentUser() user: any,
  ): Promise<NegotiationMessage> {
    return this.negotiationService.sendMessage(workflowId, bidId, user.userId, user.companyId, body.content);
  }

  @Get(':id/bids/:bidId/messages')
  @ApiOperation({ summary: 'Get negotiation thread for a bid' })
  @ApiParam({ name: 'id', type: 'number', description: 'Workflow ID' })
  @ApiParam({ name: 'bidId', type: 'number', description: 'Bid ID' })
  @ApiResponse({ status: 200, description: 'Negotiation thread', type: [NegotiationMessage] })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getThread(
    @Param('id', ParseIntPipe) workflowId: number,
    @Param('bidId', ParseIntPipe) bidId: number,
    @CurrentUser() user: any,
  ): Promise<NegotiationMessage[]> {
    return this.negotiationService.getThread(workflowId, bidId, user.companyId);
  }
}
