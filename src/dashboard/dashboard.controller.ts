import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { LeadsService } from '../leads/leads.service';
import { CallbackService } from '../callback/callback.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

class DashboardLeadQueryDto {
  @IsOptional() @IsNumber() page?: number;
  @IsOptional() @IsNumber() limit?: number;
  @IsOptional() @IsString() temperature?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller()
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private leadsService: LeadsService,
    private callbackService: CallbackService,
    private whatsappService: WhatsAppService,
  ) {}

  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Dashboard overview — counts and recent activity' })
  async getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('leads')
  @ApiOperation({ summary: 'List leads with pagination, search, temperature and date filters' })
  async getLeads(@Query() query: DashboardLeadQueryDto) {
    return this.leadsService.getLeads(query);
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Get a single lead by ID' })
  async getLead(@Query('id') id: string) {
    return this.leadsService.getLeadById(id);
  }

  @Get('callbacks')
  @ApiOperation({ summary: 'List callbacks with pagination and status filter' })
  async getCallbacks(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.callbackService.getCallbacks({ page, limit, status });
  }

  @Get('whatsapp/messages')
  @ApiOperation({ summary: 'List WhatsApp messages with pagination and filters' })
  async getWhatsappMessages(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('phoneNumber') phoneNumber?: string,
  ) {
    return this.whatsappService.getMessages({ page, limit, status, phoneNumber });
  }
}
