import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Call } from '../calls/call.schema';
import { FollowupOrchestratorService } from '../followup/followup-orchestrator.service';
export declare const FOLLOWUP_QUEUE = "followup-queue";
export declare const WHATSAPP_RETRY_QUEUE = "whatsapp-retry-queue";
export declare const CLEANUP_QUEUE = "cleanup-queue";
export declare class JobsService implements OnModuleInit {
    private config;
    private callModel;
    private followupOrchestrator;
    private readonly logger;
    private connection;
    private followupQueue;
    private worker?;
    constructor(config: ConfigService, callModel: Model<Call>, followupOrchestrator: FollowupOrchestratorService);
    onModuleInit(): Promise<void>;
    private startFollowupWorker;
    enqueuePostCallFollowup(callId: string): Promise<void>;
    enqueueWhatsappRetry(messageId: string, phoneNumber: string, message: string): Promise<void>;
    processScheduledCallbacks(): Promise<void>;
}
