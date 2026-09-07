import { Document, Types } from 'mongoose';
export type WhatsAppMessageType = 'text' | 'document' | 'image' | 'template';
export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
export type WhatsAppMessageDocument = WhatsAppMessage & Document;
export declare class WhatsAppMessage {
    _id: Types.ObjectId;
    leadId?: Types.ObjectId;
    phoneNumber: string;
    message: string;
    type: WhatsAppMessageType;
    status: WhatsAppMessageStatus;
    providerMessageId?: string;
    sentAt?: Date;
    deliveredAt?: Date;
    deliveryInfo: Record<string, any>;
    errorInfo: Record<string, any>;
    mediaUrl?: string;
    mediaId?: string;
    triggerAction?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const WhatsAppMessageSchema: import("mongoose").Schema<WhatsAppMessage, import("mongoose").Model<WhatsAppMessage, any, any, any, Document<unknown, any, WhatsAppMessage, any, {}> & WhatsAppMessage & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WhatsAppMessage, Document<unknown, {}, import("mongoose").FlatRecord<WhatsAppMessage>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<WhatsAppMessage> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
