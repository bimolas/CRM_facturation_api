import { Controller, Post, Get, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { TeamService } from './team.service.js';
import { Team } from './team.entity.js';
import { TeamMember } from './team-member.entity.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @ApiOperation({ summary: 'Create a team' })
  @ApiResponse({ status: 201, description: 'Team created', type: Team })
  create(@Body() body: { name: string; description?: string; tags?: string[]; managerId?: number }, @CurrentUser() user: any): Promise<Team> {
    return this.teamService.create(body, user.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'List teams for the authenticated company' })
  @ApiResponse({ status: 200, description: 'List of teams', type: [Team] })
  findAll(@CurrentUser() user: any): Promise<Team[]> {
    return this.teamService.findAll(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team with members and assigned work items' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Team detail' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.teamService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team details' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Team updated', type: Team })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; description?: string; tags?: string[] },
    @CurrentUser() user: any,
  ): Promise<Team> {
    return this.teamService.update(id, body, user.companyId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to a team' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiBody({ schema: { properties: { userId: { type: 'number' } }, required: ['userId'] } })
  @ApiResponse({ status: 201, description: 'Member added', type: TeamMember })
  addMember(
    @Param('id', ParseIntPipe) teamId: number,
    @Body() body: { userId: number },
    @CurrentUser() user: any,
  ): Promise<TeamMember> {
    return this.teamService.addMember(teamId, body.userId, user.companyId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from a team' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  removeMember(
    @Param('id', ParseIntPipe) teamId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.teamService.removeMember(teamId, userId, user.companyId);
  }
}
