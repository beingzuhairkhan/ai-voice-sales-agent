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
    }, templateType?: 'HOT_MID_CALL' | 'POST_CALL_FOLLOWUP'): Promise<WhatsAppMessage>;
    sendDocument(phoneNumber: string, documentUrl: string, caption?: string, options?: {
        leadId?: Types.ObjectId | string;
        triggerAction?: string;
    }): Promise<WhatsAppMessage>;
    sendImage(phoneNumber: string, imageUrl: string, caption?: string, options?: {
        leadId?: Types.ObjectId | string;
        triggerAction?: string;
    }): Promise<WhatsAppMessage>;
    sendFollowupWithAttachments(phoneNumber: string, message: string, templateType: 'POST_CALL_FOLLOWUP', options?: {
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
    handleStatusWebhook(status: any): Promise<(import("mongoose").Document<unknown, {}, WhatsAppMessage, {}, {}> & WhatsAppMessage & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }) | null | undefined>;
}
