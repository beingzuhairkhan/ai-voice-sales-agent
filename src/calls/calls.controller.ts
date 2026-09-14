import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { StartCallDto, CallQueryDto } from './dto/call.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller('calls')
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start an outbound call (defaults to +918688664337)' })
  async startCall(@Body() dto: StartCallDto) {
    const assistandId = process.env.VAPI_ASSISTANT_ID;
    if(!assistandId) {
      throw new Error('VAPI_ASSISTANT_ID is not set in environment variables');
    }
    return this.callsService.startCall(dto.phoneNumber, assistandId);
  }

  @Get()
  @ApiOperation({ summary: 'List calls with pagination and filters' })
  async getCalls(@Query() query: CallQueryDto) {
    return this.callsService.getCalls(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single call by ID' })
  async getCall(@Param('id') id: string) {
    return this.callsService.getCallById(id);
  }

  @Get(':id/transcript')
  @ApiOperation({ summary: 'Get the transcript for a call' })
  async getTranscript(@Param('id') id: string) {
    const call = await this.callsService.getCallById(id);
    return { callId: id, transcript: call.transcript || '', language: call.language };
  }

  @Get(':id/lead')
  @ApiOperation({ summary: 'Get the lead associated with a call' })
  async getLead(@Param('id') id: string) {
    const call = await this.callsService.getCallById(id);
    return { callId: id, leadId: call.leadId };
  }

  @Get(':id/actions')
  @ApiOperation({ summary: 'Get action events for a call' })
  async getActions(@Param('id') id: string) {
    return this.callsService.getActionsByCallId(id);
  }
}
