"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const webhook_event_schema_1 = require("./webhook-event.schema");
const action_event_schema_1 = require("../common/types/action-event.schema");
const calls_service_1 = require("../calls/calls.service");
const conversations_service_1 = require("../conversations/conversations.service");
const leads_service_1 = require("../leads/leads.service");
const lead_extraction_service_1 = require("../ai/lead-extraction.service");
const qualification_service_1 = require("../qualification/qualification.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const followup_generation_service_1 = require("../ai/followup-generation.service");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const jobs_service_1 = require("../jobs/jobs.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(webhookEventModel, actionEventModel, callsService, conversationsService, leadsService, extractionService, qualificationService, whatsappService, followupGen, config, followupQueue) {
        this.webhookEventModel = webhookEventModel;
        this.actionEventModel = actionEventModel;
        this.callsService = callsService;
        this.conversationsService = conversationsService;
        this.leadsService = leadsService;
        this.extractionService = extractionService;
        this.qualificationService = qualificationService;
        this.whatsappService = whatsappService;
        this.followupGen = followupGen;
        this.config = config;
        this.followupQueue = followupQueue;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    async handleVapiWebhook(payload) {
        const providerEventId = this.extractEventId(payload);
        const eventType = payload.type || payload.message?.type || 'unknown';
        const existing = await this.webhookEventModel.findOne({ providerEventId }).exec();
        if (existing) {
            this.logger.log({ providerEventId }, 'Duplicate Vapi webhook event, skipping');
            existing.status = 'duplicate';
            await existing.save();
            return { status: 'duplicate', message: 'Event already processed' };
        }
        const webhookEvent = await this.webhookEventModel.create({
            provider: 'vapi',
            providerEventId,
            eventType,
            status: 'received',
            rawPayload: payload,
        });
        const startTime = Date.now();
        try {
            const result = await this.processEvent(payload, eventType);
            webhookEvent.status = 'processed';
            webhookEvent.callId = result.callId ? new mongoose_2.Types.ObjectId(result.callId) : undefined;
            webhookEvent.processingTimeMs = Date.now() - startTime;
            await webhookEvent.save();
            return result;
        }
        catch (err) {
            const errorMsg = err.message;
            webhookEvent.status = 'failed';
            webhookEvent.errorMessage = errorMsg;
            webhookEvent.processingTimeMs = Date.now() - startTime;
            await webhookEvent.save();
            this.logger.error({ err: errorMsg, providerEventId }, 'Vapi webhook processing failed');
            return { status: 'failed', message: errorMsg };
        }
    }
    async processEvent(payload, eventType) {
        const call = payload.message?.call;
        const vapiCallId = call?.id;
        let internalCallId;
        if (vapiCallId) {
            const internalCall = await this.callsService.getCallByVapiId(vapiCallId);
            internalCallId = internalCall?._id?.toString();
        }
        switch (eventType) {
            case 'status-update':
            case 'call-start':
                return this.handleStatusUpdate(payload, internalCallId);
            case 'end-of-call-report':
            case 'call-ended': {
                await this.handleTranscript(payload, internalCallId);
                return this.handleEndOfCall(payload, internalCallId);
            }
            default:
                this.logger.log({ eventType }, 'Unknown Vapi event type, storing but not processing');
                return { status: 'ignored', message: `Unknown event type: ${eventType}` };
        }
    }
    async handleStatusUpdate(payload, callId) {
        const call = payload.message?.call;
        if (!callId || !call)
            return { status: 'ignored', message: 'No internal call found for status update' };
        const status = this.mapVapiStatus(call.status);
        await this.callsService.updateCallStatus(callId, status, {
            startTime: call.startedAt ? new Date(call.startedAt) : undefined,
        });
        return { status: 'processed', callId };
    }
    async handleTranscript(payload, callId) {
        const isEndOfCall = payload.message?.type === 'end-of-call-report';
        const transcript = isEndOfCall
            ? payload.message?.artifact?.transcript
            : payload.message?.transcript?.transcript;
        console.log("transcript", transcript);
        if (!callId || !transcript) {
            return {
                status: 'ignored',
                message: 'No transcript data',
            };
        }
        const role = isEndOfCall
            ? 'user'
            : (payload.message?.transcript?.role || 'user');
        const language = isEndOfCall
            ? 'unknown'
            : (payload.message?.transcript?.language || 'unknown');
        const message = transcript.trim();
        if (!message) {
            return {
                status: 'ignored',
                message: 'Empty transcript',
            };
        }
        const providerEventId = this.extractEventId(payload);
        await this.conversationsService.addMessage({
            callId,
            role,
            message,
            language,
            providerEventId,
        });
        return {
            status: 'processed',
            callId,
        };
    }
    async handleToolCall(payload, callId) {
        const toolCall = payload.message?.toolCall;
        if (!toolCall)
            return { status: 'ignored', message: 'No tool call data' };
        this.logger.log({ toolName: toolCall.name, callId }, 'Vapi tool call event received (handled by voice tool endpoints)');
        return { status: 'processed', callId };
    }
    async debugHandleEndOfCall(callId) {
        const webhookEvent = await this.webhookEventModel
            .findOne({
            provider: 'vapi',
            eventType: 'end-of-call-report',
            callId: new mongoose_2.Types.ObjectId(callId),
        })
            .sort({ createdAt: -1 })
            .exec();
        if (!webhookEvent) {
            return {
                status: 'failed',
                message: `No end-of-call-report found for callId: ${callId}`,
            };
        }
        this.logger.warn({
            callId,
            webhookEventId: webhookEvent._id.toString(),
            providerEventId: webhookEvent.providerEventId,
        }, 'DEBUG: replaying stored Vapi end-of-call event');
        console.log("webhookEvent", webhookEvent);
        return this.handleEndOfCall(webhookEvent.rawPayload, callId);
    }
    async handleEndOfCall(payload, callId) {
        const call = payload.message?.call;
        if (!callId)
            return { status: 'ignored', message: 'No internal call for end-of-call' };
        const duration = payload.message?.artifact?.durationSeconds;
        const transcript = payload.message?.artifact?.transcript;
        const recordingUrl = payload.message?.artifact?.recordingUrl;
        const summary = payload.message?.artifact?.summary || '';
        if (transcript) {
            await this.callsService.saveTranscript(callId, transcript);
        }
        await this.callsService.endCall(callId, duration, summary);
        if (recordingUrl) {
            await this.callsService.updateCallStatus(callId, 'ended', { recordingUrl });
        }
        try {
            const extraction = await this.extractionService.extractFromConversation(callId);
            const callDoc = await this.callsService.getCallById(callId);
            const lead = await this.leadsService.createOrUpdateFromExtraction(callId, callDoc.phoneNumber, extraction);
            const fullTranscript = transcript || await this.conversationsService.getTranscriptText(callId);
            const qualification = await this.qualificationService.qualify({
                extractedData: extraction,
                transcript: fullTranscript,
            });
            await this.leadsService.updateQualification(lead._id, qualification.temperature, qualification.intentScore, qualification.confidence, qualification.evidence, qualification.reasoning);
            await this.actionEventModel.create({
                type: 'LEAD_CLASSIFIED',
                callId: new mongoose_2.Types.ObjectId(callId),
                leadId: lead._id,
                data: { temperature: qualification.temperature, intentScore: qualification.intentScore },
                success: true,
            });
            await this.callsService.updateCallStatus(callId, 'ended', { leadId: lead._id });
            const job = await this.followupQueue.add('POST_CALL_FOLLOWUP', {
                callId,
            }, {
                jobId: `post-call-followup-${callId}`,
                removeOnComplete: true,
                removeOnFail: false,
            });
            console.log("JOB", job.id);
        }
        catch (err) {
            this.logger.error({ err: err.message, callId }, 'Post-call extraction/classification failed');
        }
        return { status: 'processed', callId };
    }
    extractEventId(payload) {
        const anyPayload = payload;
        return (anyPayload.id ||
            anyPayload.message?.call?.id + ':' + (anyPayload.type || anyPayload.message?.type) ||
            anyPayload.message?.call?.id + ':' + Date.now());
    }
    mapVapiStatus(vapiStatus) {
        const map = {
            ringing: 'ringing',
            'in-progress': 'in-progress',
            ongoing: 'in-progress',
            ended: 'ended',
            completed: 'ended',
            failed: 'failed',
            'no-answer': 'no-answer',
            busy: 'busy',
            cancelled: 'cancelled',
            queued: 'initiated',
        };
        return map[vapiStatus || ''] || 'initiated';
    }
    async listEvents(params) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 15));
        const skip = (page - 1) * limit;
        const filter = {};
        if (params.status?.trim()) {
            filter.status = params.status.trim();
        }
        if (params.search?.trim()) {
            const search = params.search.trim();
            filter.$or = [
                { providerEventId: { $regex: search, $options: 'i' } },
                { eventType: { $regex: search, $options: 'i' } },
                { provider: { $regex: search, $options: 'i' } },
                { errorMessage: { $regex: search, $options: 'i' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.webhookEventModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.webhookEventModel.countDocuments(filter).exec(),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(webhook_event_schema_1.WebhookEvent.name)),
    __param(1, (0, mongoose_1.InjectModel)(action_event_schema_1.ActionEvent.name)),
    __param(10, (0, bullmq_1.InjectQueue)(jobs_service_1.FOLLOWUP_QUEUE)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        calls_service_1.CallsService,
        conversations_service_1.ConversationsService,
        leads_service_1.LeadsService,
        lead_extraction_service_1.LeadExtractionService,
        qualification_service_1.QualificationService,
        whatsapp_service_1.WhatsAppService,
        followup_generation_service_1.FollowupService,
        config_1.ConfigService,
        bullmq_2.Queue])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map