import { WhatsAppService } from './whatsapp.service';
export declare class WhatsAppController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsAppService);
    verifyWebhook(mode: string, token: string, challenge: string): string;
    whatsappWebhook(body: any): Promise<{
        success: boolean;
    }>;
    testSendMessage(): Promise<{
        success: boolean;
        data: import("./whatsapp-message.schema").WhatsAppMessage;
    }>;
}
