import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { WhatsAppMessage } from './whatsapp-message.schema';
import { WhatsAppProvider } from './whatsapp-provider.interface';
export declare class WhatsAppService {
    private messageModel;
    private provider;
    private config;
    private readonly logger;
    private readonly resumeUrl;
    private readonly architectureImageUrl;
    constructor(messageModel: Model<WhatsAppMessage>, provider: WhatsAppProvider, config: ConfigService);
    sendTextMessage(phoneNumber: string, message: string, options?: {
        leadId?: Types.ObjectId | string;
        triggerAction?: string;
    }): Promise<WhatsAppMessage>;
    sendDocument(phoneNumber: string, documentUrl: string, caption?: string, options?: {
        leadId?: Types.ObjectId | string;
        triggerAction?: string;
    }): Promise<WhatsAppMessage>;
    sendImage(phoneNumber: string, imageUrl: string, caption?: string, options?: {
        leadId?: Types.ObjectId | string;
        triggerAction?: string;
    }): Promise<WhatsAppMessage>;
    sendFollowupWithAttachments(phoneNumber: string, message: string, options?: {
        leadId?: Types.ObjectId | string;
        triggerAction?: string;
    }): Promise<{
        textMessage: WhatsAppMessage;
        attachments: WhatsAppMessage[];
    }>;
    getMessages(query: {
        page?: number;
        limit?: number;
        status?: string;
        phoneNumber?: string;
    }): Promise<{
        messages: WhatsAppMessage[];
        total: number;
        page: number;
        limit: number;
    }>;
}
