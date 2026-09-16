import { Model, Types } from 'mongoose';
import { WebhookEvent } from './webhook-event.schema';
import { ActionEvent } from '../common/types/action-event.schema';
import { CallsService } from '../calls/calls.service';
import { ConversationsService } from '../conversations/conversations.service';
import { LeadsService } from '../leads/leads.service';
import { LeadExtractionService } from '../ai/lead-extraction.service';
import { QualificationService } from '../qualification/qualification.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { FollowupService as FollowupGenerationService } from '../ai/followup-generation.service';
import { ConfigService } from '@nestjs/config';
import { VapiWebhookEvent } from '../vapi/vapi-provider.interface';
import { Queue } from 'bullmq';
import { JobsService } from '@/jobs/jobs.service';
import { LlmProvider } from '@/ai/llm-provider.interface';
export interface WebhookProcessResult {
    status: 'processed' | 'duplicate' | 'ignored' | 'failed';
    callId?: string;
    message?: string;
}
export declare class WebhooksService {
    private webhookEventModel;
    private actionEventModel;
    private callsService;
    private conversationsService;
    private leadsService;
    private extractionService;
    private qualificationService;
    private whatsappService;
    private followupGen;
    private config;
    private readonly followupQueue;
    private jobsService;
    private llmProvider;
    private readonly logger;
    constructor(webhookEventModel: Model<WebhookEvent>, actionEventModel: Model<ActionEvent>, callsService: CallsService, conversationsService: ConversationsService, leadsService: LeadsService, extractionService: LeadExtractionService, qualificationService: QualificationService, whatsappService: WhatsAppService, followupGen: FollowupGenerationService, config: ConfigService, followupQueue: Queue, jobsService: JobsService, llmProvider: LlmProvider);
    handleVapiWebhook(payload: VapiWebhookEvent): Promise<WebhookProcessResult>;
    private processEvent;
    private handleStatusUpdate;
    private handleTranscript;
    private handleToolCall;
    debugHandleEndOfCall(callId: string): Promise<WebhookProcessResult>;
    private handleEndOfCall;
    private extractEventId;
    private mapVapiStatus;
    listEvents(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<{
        data: (import("mongoose").FlattenMaps<{
            _id: Types.ObjectId;
            provider: import("./webhook-event.schema").WebhookProvider;
            providerEventId: string;
            eventType?: string | undefined;
            status: import("./webhook-event.schema").WebhookEventStatus;
            rawPayload: {
                [x: string]: any;
            };
            callId?: Types.ObjectId | undefined;
            errorMessage?: string | undefined;
            processingTimeMs?: number | undefined;
            createdAt: Date;
            updatedAt: Date;
        }> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
