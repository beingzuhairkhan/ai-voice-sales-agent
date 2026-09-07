import {
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

@Controller()
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
  ) {}

  @Post('webhooks/whatsapp')
  @HttpCode(200)
  async whatsappWebhook(@Body() body: any) {
    if (
      body?.object !==
      'whatsapp_business_account'
    ) {
      return { success: true };
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const statuses =
          change.value?.statuses || [];

        for (const status of statuses) {
          await this.whatsappService.handleStatusWebhook(
            status,
          );
        }
      }
    }

    return { success: true };
  }
}
