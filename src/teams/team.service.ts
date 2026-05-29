import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity.js';
import { TeamMember } from './team-member.entity.js';
import { User } from '../identity/user/user.entity.js';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly memberRepo: Repository<TeamMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: { name: string; description?: string; tags?: string[]; managerId?: number }, companyId: number): Promise<Team> {
    const team = this.teamRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      tags: dto.tags ?? [],
      company: { id: companyId } as any,
      manager: dto.managerId ? { id: dto.managerId } as any : null,
    });
    return this.teamRepo.save(team);
  }

  async findAll(companyId: number): Promise<Team[]> {
    return this.teamRepo.find({
      where: { company: { id: companyId } },
      relations: ['manager', 'company'],
    });
  }

  async findOne(id: number, companyId: number): Promise<Team & { members: TeamMember[] }> {
    const team = await this.teamRepo.findOne({
      where: { id, company: { id: companyId } },
      relations: ['manager', 'company'],
    });
    if (!team) throw new NotFoundException(`Team #${id} not found`);

    const members = await this.memberRepo.find({
      where: { team: { id } },
      relations: ['user'],
    });

    return { ...team, members };
  }

  async update(id: number, dto: { name?: string; description?: string; tags?: string[] }, companyId: number): Promise<Team> {
    const team = await this.teamRepo.findOne({ where: { id, company: { id: companyId } } });
    if (!team) throw new NotFoundException(`Team #${id} not found`);

    if (dto.name !== undefined) team.name = dto.name;
    if (dto.description !== undefined) team.description = dto.description;
    if (dto.tags !== undefined) team.tags = dto.tags;

    return this.teamRepo.save(team);
  }

  async addMember(teamId: number, userId: number, companyId: number): Promise<TeamMember> {
    const team = await this.teamRepo.findOne({
      where: { id: teamId, company: { id: companyId } },
      relations: ['company'],
    });
    if (!team) throw new NotFoundException(`Team #${teamId} not found`);

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });
    if (!user) throw new NotFoundException(`User #${userId} not found`);

    if ((user as any).company?.id !== companyId) {
      throw new BadRequestException('User does not belong to the same company as the team');
    }

    const existing = await this.memberRepo.findOne({ where: { team: { id: teamId }, user: { id: userId } } });
    if (existing) throw new BadRequestException('User is already a member of this team');

    const member = this.memberRepo.create({ team, user });
    return this.memberRepo.save(member);
  }

  async removeMember(teamId: number, userId: number, companyId: number): Promise<void> {
    const team = await this.teamRepo.findOne({ where: { id: teamId, company: { id: companyId } } });
    if (!team) throw new NotFoundException(`Team #${teamId} not found`);

    const member = await this.memberRepo.findOne({ where: { team: { id: teamId }, user: { id: userId } } });
    if (!member) throw new NotFoundException(`User #${userId} is not a member of team #${teamId}`);

    await this.memberRepo.remove(member);
  }
}
