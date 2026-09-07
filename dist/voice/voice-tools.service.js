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
var VoiceToolsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceToolsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const call_schema_1 = require("../calls/call.schema");
const lead_schema_1 = require("../leads/lead.schema");
const action_event_schema_1 = require("../common/types/action-event.schema");
const leads_service_1 = require("../leads/leads.service");
const conversations_service_1 = require("../conversations/conversations.service");
const lead_extraction_service_1 = require("../ai/lead-extraction.service");
const qualification_service_1 = require("../qualification/qualification.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const followup_generation_service_1 = require("../ai/followup-generation.service");
const callback_service_1 = require("../callback/callback.service");
const vapi_provider_1 = require("../vapi/vapi-provider");
let VoiceToolsService = VoiceToolsService_1 = class VoiceToolsService {
    constructor(callModel, leadModel, actionEventModel, leadsService, conversationsService, extractionService, qualificationService, whatsappService, followupGen, callbackService, vapiProvider, config) {
        this.callModel = callModel;
        this.leadModel = leadModel;
        this.actionEventModel = actionEventModel;
        this.leadsService = leadsService;
        this.conversationsService = conversationsService;
        this.extractionService = extractionService;
        this.qualificationService = qualificationService;
        this.whatsappService = whatsappService;
        this.followupGen = followupGen;
        this.callbackService = callbackService;
        this.vapiProvider = vapiProvider;
        this.config = config;
        this.logger = new common_1.Logger(VoiceToolsService_1.name);
    }
    async updateLead(dto) {
        const call = await this.validateActiveCall(dto.callId);
        let lead = await this.leadsService.getLeadByCallId(dto.callId);
        if (!lead) {
            lead = new this.leadModel({
                callId: call._id,
                phoneNumber: call.phoneNumber,
                temperature: 'UNKNOWN',
                intentScore: 0,
                confidence: 0,
            });
            await lead.save();
            await this.callModel.findByIdAndUpdate(call._id, { leadId: lead._id }).exec();
        }
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name || lead.name;
        if (dto.productDescription !== undefined)
            updateData.productDescription = dto.productDescription || lead.productDescription;
        if (dto.productCount !== undefined)
            updateData.productCount = dto.productCount;
        if (dto.budget !== undefined)
            updateData.budget = dto.budget;
        if (dto.currency !== undefined)
            updateData.currency = dto.currency;
        if (dto.timeline !== undefined)
            updateData.timeline = dto.timeline;
        if (dto.isDecisionMaker !== undefined)
            updateData.isDecisionMaker = dto.isDecisionMaker;
        if (dto.language !== undefined)
            updateData.language = dto.language;
        if (dto.requiredFeatures)
            updateData.requiredFeatures = [...new Set([...lead.requiredFeatures, ...dto.requiredFeatures])];
        if (dto.painPoints)
            updateData.painPoints = [...new Set([...lead.painPoints, ...dto.painPoints])];
        if (dto.barriers)
            updateData.barriers = [...new Set([...lead.barriers, ...dto.barriers])];
        if (dto.objections)
            updateData.objections = [...new Set([...lead.objections, ...dto.objections])];
        if (dto.buyingSignals)
            updateData.buyingSignals = [...new Set([...lead.buyingSignals, ...dto.buyingSignals])];
        Object.assign(lead, updateData);
        await lead.save();
        await this.actionEventModel.create({
            type: 'LEAD_EXTRACTED',
            callId: call._id,
            leadId: lead._id,
            data: updateData,
            success: true,
        });
        return {
            success: true,
            leadId: lead._id.toString(),
            message: 'Lead updated successfully',
        };
    }
    async sendWhatsapp(dto) {
        console.log('========== SEND WHATSAPP START ==========');
        console.log('DTO:', dto);
        try {
            console.log('Validating active call...');
            const call = await this.validateActiveCall(dto.callId);
            console.log('ACTIVE CALL:', call);
            if (!call.leadId) {
                throw new common_1.BadRequestException(`No leadId associated with call ${call._id}`);
            }
            console.log('Finding lead for callId:', dto.callId);
            const lead = await this.leadsService.getLeadById(call.leadId.toString());
            console.log('FOUND LEAD:', lead);
            if (!lead) {
                console.log('❌ NO LEAD FOUND for callId:', call._id);
                throw new common_1.BadRequestException('No lead found for this call — call update_lead first');
            }
            console.log('Lead ID:', lead._id);
            console.log('Phone Number:', call.phoneNumber);
            console.log('Message Content:', dto.messageContent);
            console.log('Checking if HOT WhatsApp was already sent...');
            const alreadySent = await this.leadsService.hasHotWhatsappBeenSent(lead._id);
            console.log('Already sent:', alreadySent);
            if (alreadySent) {
                console.log('⚠️ WhatsApp already sent. Skipping duplicate send.');
                return {
                    success: true,
                    message: 'WhatsApp already sent for this lead. Not sending again.',
                };
            }
            console.log('Creating WHATSAPP_TRIGGERED action event...');
            await this.actionEventModel.create({
                type: 'WHATSAPP_TRIGGERED',
                callId: call._id,
                leadId: lead._id,
                data: {
                    trigger: 'VOICE_TOOL',
                    messageLength: dto.messageContent.length,
                },
                success: true,
            });
            console.log('WHATSAPP_TRIGGERED event created.');
            try {
                console.log('Sending WhatsApp message...');
                console.log('To:', call.phoneNumber);
                console.log('Message:', dto.messageContent);
                const whatsappMsg = await this.whatsappService.sendTextMessage(call.phoneNumber, dto.messageContent, {
                    leadId: lead._id,
                    triggerAction: 'HOT_MID_CALL',
                });
                console.log('✅ WhatsApp API response:', whatsappMsg);
                console.log('Marking HOT WhatsApp as sent...');
                await this.leadsService.markHotWhatsappSent(lead._id);
                console.log('HOT WhatsApp marked as sent.');
                console.log('Creating WHATSAPP_SENT action event...');
                await this.actionEventModel.create({
                    type: 'WHATSAPP_SENT',
                    callId: call._id,
                    leadId: lead._id,
                    data: {
                        trigger: 'VOICE_TOOL',
                        messageId: whatsappMsg._id?.toString(),
                    },
                    success: true,
                });
                console.log('WHATSAPP_SENT event created.');
                const messageId = whatsappMsg._id?.toString();
                console.log('✅ WhatsApp message sent successfully.');
                console.log('Message ID:', messageId);
                console.log('========== SEND WHATSAPP END ==========');
                return {
                    success: true,
                    message: 'WhatsApp message sent successfully during the call.',
                    messageId,
                };
            }
            catch (err) {
                console.error('❌ WhatsApp send failed:', err);
                await this.actionEventModel.create({
                    type: 'WHATSAPP_FAILED',
                    callId: call._id,
                    leadId: lead._id,
                    data: {
                        error: err.message,
                        trigger: 'VOICE_TOOL',
                    },
                    success: false,
                });
                console.log('WHATSAPP_FAILED event created.');
                console.log('========== SEND WHATSAPP END (FAILED) ==========');
                return {
                    success: false,
                    message: `WhatsApp send failed: ${err.message}`,
                };
            }
        }
        catch (err) {
            console.error('❌ SEND WHATSAPP ERROR:', err);
            console.log('========== SEND WHATSAPP END (ERROR) ==========');
            throw err;
        }
    }
    async bookCallback(dto) {
        try {
            const vapiCallId = dto.message?.call?.id;
            if (!vapiCallId) {
                throw new common_1.BadRequestException('Vapi call ID not found in webhook payload');
            }
            const toolCall = dto.message?.toolCalls?.find((tool) => tool.function?.name === 'book_callback');
            if (!toolCall) {
                throw new common_1.BadRequestException('book_callback tool call not found');
            }
            const args = typeof toolCall.function.arguments === 'string'
                ? JSON.parse(toolCall.function.arguments)
                : toolCall.function.arguments;
            const requestedTime = args?.requestedTime;
            const reason = args?.reason;
            if (!requestedTime) {
                return {
                    success: false,
                    clarificationNeeded: true,
                    confirmationMessage: 'What day and time would you like us to call you back?',
                };
            }
            const call = await this.callModel.findOne({
                vapiCallId,
            });
            if (!call) {
                throw new common_1.BadRequestException(`No call found for Vapi call ID: ${vapiCallId}`);
            }
            const lead = await this.leadsService.getLeadByCallId(call._id);
            await this.actionEventModel.create({
                type: 'CALLBACK_REQUESTED',
                callId: call._id,
                leadId: lead?._id,
                data: {
                    requestedTime,
                    reason,
                },
                success: true,
            });
            const result = await this.callbackService.requestCallback({
                leadId: lead?._id,
                callId: call._id,
                requestedTimePhrase: requestedTime,
                reason,
            });
            if (!result.clarificationNeeded &&
                result.callback) {
                await this.actionEventModel.create({
                    type: 'CALLBACK_BOOKED',
                    callId: call._id,
                    leadId: lead?._id,
                    data: {
                        callbackId: result.callback._id?.toString(),
                        dateTime: result.callback.parsedDateTime,
                    },
                    success: true,
                });
            }
            const response = {
                success: !result.clarificationNeeded,
                clarificationNeeded: result.clarificationNeeded,
                confirmationMessage: result.confirmationMessage,
                callbackId: result.callback?._id?.toString(),
            };
            return response;
        }
        catch (error) {
            throw error;
        }
    }
    async getLeadContext(dto) {
        await this.validateActiveCall(dto.callId);
        const lead = await this.leadsService.getLeadByCallId(dto.callId);
        if (!lead)
            throw new common_1.NotFoundException('No lead context found for this call');
        return {
            leadId: lead._id.toString(),
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
            temperature: lead.temperature,
            intentScore: lead.intentScore,
            hotWhatsappSent: lead.hotWhatsappSent,
            language: lead.language,
        };
    }
    async endCall(dto) {
        const call = await this.validateActiveCall(dto.callId);
        if (call.vapiCallId) {
            try {
                await this.vapiProvider.endCall(call.vapiCallId);
            }
            catch (err) {
                this.logger.warn({ err: err.message }, 'Failed to end call in Vapi, proceeding with local end');
            }
        }
        await this.callModel.findByIdAndUpdate(call._id, {
            status: 'ended',
            endTime: new Date(),
        }).exec();
        await this.actionEventModel.create({
            type: 'CALL_ENDED',
            callId: call._id,
            data: { summary: dto.summary, trigger: 'VOICE_TOOL' },
            success: true,
        });
        return { success: true, message: 'Call ended successfully' };
    }
    async validateActiveCall(callId) {
        const call = await this.callModel
            .findOne({ vapiCallId: callId })
            .exec();
        console.log("voice service validateActiveCall", call);
        if (!call)
            throw new common_1.NotFoundException(`Call ${callId} not found`);
        if (call.status === 'ended' || call.status === 'failed' || call.status === 'cancelled') {
            throw new common_1.BadRequestException(`Call ${callId} is not active (status: ${call.status})`);
        }
        return call;
    }
};
exports.VoiceToolsService = VoiceToolsService;
exports.VoiceToolsService = VoiceToolsService = VoiceToolsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(call_schema_1.Call.name)),
    __param(1, (0, mongoose_2.InjectModel)(lead_schema_1.Lead.name)),
    __param(2, (0, mongoose_2.InjectModel)(action_event_schema_1.ActionEvent.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        mongoose_1.Model,
        leads_service_1.LeadsService,
        conversations_service_1.ConversationsService,
        lead_extraction_service_1.LeadExtractionService,
        qualification_service_1.QualificationService,
        whatsapp_service_1.WhatsAppService,
        followup_generation_service_1.FollowupService,
        callback_service_1.CallbackService,
        vapi_provider_1.VapiProvider,
        config_1.ConfigService])
], VoiceToolsService);
//# sourceMappingURL=voice-tools.service.js.map