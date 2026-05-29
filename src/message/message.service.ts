import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Message } from './message.entity.js';
import { User } from '../identity/user/user.entity.js';
import { Company } from '../identity/company/company.entity.js';

@Injectable()
export class MessageService {
  constructor(private readonly dataSource: DataSource) {}

  async sendMessage(
    senderUserId: number,
    senderCompanyId: number,
    receiverCompanyId: number,
    content: string,
  ): Promise<Message> {
    const userRepo = this.dataSource.getRepository(User);
    const companyRepo = this.dataSource.getRepository(Company);
    const messageRepo = this.dataSource.getRepository(Message);

    const senderUser = await userRepo.findOneBy({ id: senderUserId });
    if (!senderUser) {
      throw new NotFoundException(`User with ID ${senderUserId} not found`);
    }

    const senderCompany = await companyRepo.findOneBy({ id: senderCompanyId });
    if (!senderCompany) {
      throw new NotFoundException(`Company with ID ${senderCompanyId} not found`);
    }

    const receiverCompany = await companyRepo.findOneBy({ id: receiverCompanyId });
    if (!receiverCompany) {
      throw new NotFoundException(`Company with ID ${receiverCompanyId} not found`);
    }

    const message = new Message({
      content,
      sender: senderUser,
      senderCompany,
      receiverCompany,
    });

    return messageRepo.save(message);
  }

  async getConversationHistory(
    companyIdA: number,
    companyIdB: number,
  ): Promise<Message[]> {
    const messageRepo = this.dataSource.getRepository(Message);

    return messageRepo.find({
      where: [
        {
          senderCompany: { id: companyIdA },
          receiverCompany: { id: companyIdB },
        },
        {
          senderCompany: { id: companyIdB },
          receiverCompany: { id: companyIdA },
        },
      ],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async getConversations(companyId: number): Promise<Company[]> {
    const messageRepo = this.dataSource.getRepository(Message);
    const companyRepo = this.dataSource.getRepository(Company);

    // Get all unique companies A has received from or sent to
    const messages = await messageRepo.find({
      where: [
        { senderCompany: { id: companyId } },
        { receiverCompany: { id: companyId } },
      ],
    });

    const partnerCompanyIds = new Set<number>();
    for (const msg of messages) {
      if (msg.senderCompany.id !== companyId) {
        partnerCompanyIds.add(msg.senderCompany.id);
      }
      if (msg.receiverCompany.id !== companyId) {
        partnerCompanyIds.add(msg.receiverCompany.id);
      }
    }

    if (partnerCompanyIds.size === 0) {
      return [];
    }

    // Load the full company objects
    const ids = Array.from(partnerCompanyIds);
    const partners = await companyRepo.find({
      where: ids.map((id) => ({ id })),
    });

    return partners;
  }
}
