import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { VapiWebhookEvent } from '@/vapi/vapi-provider.interface';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private webhooksService: WebhooksService,
    private config: ConfigService,
  ) { }

  /**
  * Dashboard endpoint:
  * GET /api/v1/webhooks/events
  */
  @Get('events')
  @ApiOperation({
    summary: 'List stored webhook events',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 15,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: '',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    example: '',
  })
  async listEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.webhooksService.listEvents({
      page: Number(page) || 1,
      limit: Number(limit) || 15,
      search,
      status,
    });
  }


  @Public()
  @Post('vapi')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Vapi webhook receiver — call status, transcripts, tool calls, end-of-call reports',
  })
  async handleVapiWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const expectedSecret = this.config.get<string>('VAPI_WEBHOOK_SECRET');

    if (expectedSecret) {
      const authorization = headers['authorization'];

      const expectedAuthorization = `Bearer ${expectedSecret}`;

      if (authorization !== expectedAuthorization) {
        req.log?.warn(
          {
            hasAuthorization: !!authorization,
          },
          'Vapi webhook secret mismatch',
        );

        return { status: 'unauthorized' };
      }
    }

    const result = await this.webhooksService.handleVapiWebhook(body);

    return result;
  }

  @Public()
  @Post('vapi/debug/end-of-call')
  @HttpCode(200)
  @ApiOperation({
    summary: 'DEBUG: Replay end-of-call processing from stored Vapi event',
  })
  async debugEndOfCall(
    @Body('callId') callId: string,
  ) {
    if (!callId) {
      return {
        status: 'failed',
        message: 'callId is required',
      };
    }

    return this.webhooksService.debugHandleEndOfCall(callId);
  }





}