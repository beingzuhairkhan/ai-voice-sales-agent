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
var FollowupOrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const call_schema_1 = require("../calls/call.schema");
const lead_schema_1 = require("../leads/lead.schema");
const action_event_schema_1 = require("../common/types/action-event.schema");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const followup_generation_service_1 = require("../ai/followup-generation.service");
const conversations_service_1 = require("../conversations/conversations.service");
const lead_extraction_service_1 = require("../ai/lead-extraction.service");
let FollowupOrchestratorService = FollowupOrchestratorService_1 = class FollowupOrchestratorService {
    constructor(callModel, leadModel, actionEventModel, whatsappService, followupGen, conversationsService, extractionService) {
        this.callModel = callModel;
        this.leadModel = leadModel;
        this.actionEventModel = actionEventModel;
        this.whatsappService = whatsappService;
        this.followupGen = followupGen;
        this.conversationsService = conversationsService;
        this.extractionService = extractionService;
        this.logger = new common_1.Logger(FollowupOrchestratorService_1.name);
    }
    async processCompletedCall(callId) {
        const callObjectId = typeof callId === 'string' ? new mongoose_2.Types.ObjectId(callId) : callId;
        this.logger.log({ callId: callObjectId.toString() }, 'Processing post-call follow-up');
        const call = await this.callModel.findById(callObjectId).exec();
        if (!call) {
            return { success: false, messageSent: false, error: 'Call not found' };
        }
        let lead = await this.leadModel.findOne({ callId: callObjectId }).exec();
        if (!lead) {
            const extraction = await this.extractionService.extractFromConversation(callObjectId);
            lead = new this.leadModel({
                callId: callObjectId,
                phoneNumber: call.phoneNumber,
                temperature: 'UNKNOWN',
                intentScore: 0,
                confidence: 0,
                ...extraction,
            });
            await lead.save();
        }
        let transcript = call.transcript || '';
        if (!transcript) {
            transcript = await this.conversationsService.getTranscriptText(callObjectId);
        }
        const followupMessage = await this.followupGen.generateFollowup({
            transcript,
            extractedData: {
                name: lead.name ?? null,
                productDescription: lead.productDescription ?? null,
                productCount: lead.productCount ?? null,
                budget: lead.budget ?? null,
                currency: lead.currency ?? null,
                timeline: lead.timeline ?? null,
                requiredFeatures: lead.requiredFeatures,
                painPoints: lead.painPoints,
                isDecisionMaker: lead.isDecisionMaker ?? null,
                barriers: lead.barriers,
                objections: lead.objections,
                buyingSignals: lead.buyingSignals,
                language: lead.language || 'unknown',
            },
            temperature: lead.temperature,
        });
        await this.actionEventModel.create({
            type: 'FOLLOWUP_GENERATED',
            callId: callObjectId,
            leadId: lead._id,
            data: { messageLength: followupMessage.length },
            success: true,
        });
        try {
            const result = await this.whatsappService.sendFollowupWithAttachments(call.phoneNumber, followupMessage, { leadId: lead._id, triggerAction: 'POST_CALL_FOLLOWUP' });
            await this.actionEventModel.create({
                type: 'FOLLOWUP_SENT',
                callId: callObjectId,
                leadId: lead._id,
                data: {
                    textMessageId: result.textMessage._id?.toString(),
                    attachmentCount: result.attachments.length,
                },
                success: true,
            });
            return { success: true, messageSent: true };
        }
        catch (err) {
            const errorMsg = err.message;
            await this.actionEventModel.create({
                type: 'WHATSAPP_FAILED',
                callId: callObjectId,
                leadId: lead._id,
                data: { error: errorMsg, phase: 'post-call-followup' },
                success: false,
            });
            this.logger.error({ err: errorMsg, callId: callObjectId.toString() }, 'Post-call WhatsApp follow-up failed');
            return { success: false, messageSent: false, error: errorMsg };
        }
    }
};
exports.FollowupOrchestratorService = FollowupOrchestratorService;
exports.FollowupOrchestratorService = FollowupOrchestratorService = FollowupOrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(call_schema_1.Call.name)),
    __param(1, (0, mongoose_1.InjectModel)(lead_schema_1.Lead.name)),
    __param(2, (0, mongoose_1.InjectModel)(action_event_schema_1.ActionEvent.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        whatsapp_service_1.WhatsAppService,
        followup_generation_service_1.FollowupService,
        conversations_service_1.ConversationsService,
        lead_extraction_service_1.LeadExtractionService])
], FollowupOrchestratorService);
//# sourceMappingURL=followup-orchestrator.service.js.map