import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { ConfigService } from '@nestjs/config';
export declare class WebhooksController {
    private webhooksService;
    private config;
    constructor(webhooksService: WebhooksService, config: ConfigService);
    listEvents(page?: string, limit?: string, search?: string, status?: string): Promise<{
        data: (import("mongoose").FlattenMaps<{
            _id: import("mongoose").Types.ObjectId;
            provider: import("./webhook-event.schema").WebhookProvider;
            providerEventId: string;
            eventType?: string | undefined;
            status: import("./webhook-event.schema").WebhookEventStatus;
            rawPayload: {
                [x: string]: any;
            };
            callId?: import("mongoose").Types.ObjectId | undefined;
            errorMessage?: string | undefined;
            processingTimeMs?: number | undefined;
            createdAt: Date;
            updatedAt: Date;
        }> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    handleVapiWebhook(body: any, headers: Record<string, string>, req: Request): Promise<import("./webhooks.service").WebhookProcessResult | {
        status: string;
    }>;
    debugEndOfCall(callId: string): Promise<import("./webhooks.service").WebhookProcessResult | {
        status: string;
        message: string;
    }>;
}
