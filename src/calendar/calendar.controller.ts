import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CalendarService } from './calendar.service.js';
import { CalendarEvent } from './calendar-event.entity.js';
import { Holiday } from './holiday.entity.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('calendar/events')
  @ApiOperation({ summary: 'Get calendar events for the authenticated company' })
  @ApiQuery({ name: 'from', required: true, type: String, description: 'Start date YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: true, type: String, description: 'End date YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Calendar events', type: [CalendarEvent] })
  getEvents(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: any,
  ): Promise<CalendarEvent[]> {
    return this.calendarService.getEvents(user.companyId, new Date(from), new Date(to));
  }

  @Post('holidays')
  @ApiOperation({ summary: 'Create a holiday for the authenticated company' })
  @ApiBody({ schema: { required: ['date', 'label'], properties: { date: { type: 'string', format: 'date' }, label: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Holiday created', type: Holiday })
  createHoliday(
    @Body() body: { date: string; label: string },
    @CurrentUser() user: any,
  ): Promise<Holiday> {
    return this.calendarService.createHoliday(user.companyId, body.date, body.label);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'List holidays for the authenticated company' })
  @ApiResponse({ status: 200, description: 'Holidays list', type: [Holiday] })
  listHolidays(@CurrentUser() user: any): Promise<Holiday[]> {
    return this.calendarService.listHolidays(user.companyId);
  }
}
