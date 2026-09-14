import {
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Query,
    UnauthorizedException,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

@Controller()
export class WhatsAppController {
    constructor(
        private readonly whatsappService: WhatsAppService,
    ) { }

    @Get('webhooks/whatsapp')
    verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
    ) {
        const verifyToken =
            process.env.WHATSAPP_VERIFY_TOKEN;

        if (
            mode === 'subscribe' &&
            token === verifyToken
        ) {
            return challenge;
        }

        throw new UnauthorizedException();
    }


    @Post('webhooks/whatsapp')
    @HttpCode(200)
    async whatsappWebhook(@Body() body: any) {
        console.log('Received WhatsApp webhook:', body);
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

     @Post('test-send')
  async testSendMessage() {
    const phoneNumber = '919967705134';

    const message = `Hi Rahul, thanks for your enquiry.

You are looking to build an e-commerce website for an electronics business.

Your budget is around 52,000–60,000 INR and you're looking to launch within 1 week.

You mentioned that you need online payments and WhatsApp integration.

You can reach me directly on +91 9967705134 to discuss.`;

    const result = await this.whatsappService.sendTextMessage(
      phoneNumber,
      message,
      {
        triggerAction: 'test_send',
      },
    );

    return {
      success: true,
      data: result,
    };
  }
}
