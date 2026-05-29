import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MessageService } from './message.service.js';
import { Message } from './message.entity.js';
import { Company } from '../identity/company/company.entity.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

class SendMessageDto {
  receiverCompanyId: number;
  content: string;
}

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({
    summary: 'Send a B2B message',
    description: 'Sends a text message from the authenticated company to another partner company.',
  })
  @ApiResponse({ status: 201, type: Message })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ): Promise<Message> {
    return this.messageService.sendMessage(
      user.userId,
      user.companyId,
      dto.receiverCompanyId,
      dto.content,
    );
  }

  @Get('partner/:partnerCompanyId')
  @ApiOperation({
    summary: 'Get B2B message history with a partner company',
    description: 'Retrieves all conversation history between the current user\'s company and the specified partner.',
  })
  @ApiResponse({ status: 200, type: [Message] })
  async getConversationHistory(
    @Param('partnerCompanyId', ParseIntPipe) partnerCompanyId: number,
    @CurrentUser() user: any,
  ): Promise<Message[]> {
    return this.messageService.getConversationHistory(
      user.companyId,
      partnerCompanyId,
    );
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'Get all active B2B conversations',
    description: 'Retrieves a list of all partner companies that have active message threads with the current user\'s company.',
  })
  @ApiResponse({ status: 200, type: [Company] })
  async getConversations(@CurrentUser() user: any): Promise<Company[]> {
    return this.messageService.getConversations(user.companyId);
  }
}
