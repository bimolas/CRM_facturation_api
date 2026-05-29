import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './team.entity.js';
import { TeamMember } from './team-member.entity.js';
import { User } from '../identity/user/user.entity.js';
import { TeamService } from './team.service.js';
import { TeamController } from './team.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Team, TeamMember, User])],
  providers: [TeamService],
  controllers: [TeamController],
  exports: [TeamService],
})
export class TeamsModule {}
