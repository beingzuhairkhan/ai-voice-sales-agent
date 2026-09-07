import { WhatsAppService } from './whatsapp.service';
export declare class WhatsAppController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsAppService);
    whatsappWebhook(body: any): Promise<{
        success: boolean;
    }>;
}
