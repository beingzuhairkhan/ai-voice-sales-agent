import { Document, Types } from 'mongoose';
export type WebhookProvider = 'vapi' | 'whatsapp' | 'sarvam' | 'internal';
export type WebhookEventStatus = 'received' | 'processed' | 'duplicate' | 'failed' | 'ignored';
export type WebhookEventDocument = WebhookEvent & Document;
export declare class WebhookEvent {
    _id: Types.ObjectId;
    provider: WebhookProvider;
    providerEventId: string;
    eventType?: string;
    status: WebhookEventStatus;
    rawPayload: Record<string, any>;
    callId?: Types.ObjectId;
    errorMessage?: string;
    processingTimeMs?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const WebhookEventSchema: import("mongoose").Schema<WebhookEvent, import("mongoose").Model<WebhookEvent, any, any, any, Document<unknown, any, WebhookEvent, any, {}> & WebhookEvent & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WebhookEvent, Document<unknown, {}, import("mongoose").FlatRecord<WebhookEvent>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<WebhookEvent> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
