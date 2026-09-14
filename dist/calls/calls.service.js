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
var CallsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const call_schema_1 = require("./call.schema");
const vapi_provider_1 = require("../vapi/vapi-provider");
const action_event_schema_1 = require("../common/types/action-event.schema");
const leads_service_1 = require("../leads/leads.service");
let CallsService = CallsService_1 = class CallsService {
    constructor(callModel, actionEventModel, vapiProvider, config, leadsService) {
        this.callModel = callModel;
        this.actionEventModel = actionEventModel;
        this.vapiProvider = vapiProvider;
        this.config = config;
        this.leadsService = leadsService;
        this.logger = new common_1.Logger(CallsService_1.name);
        this.defaultPhoneNumber = this.config.get('VAPI_PHONE_NUMBER', '+918688664337');
    }
    async startCall(phoneNumber, assistantId, context) {
        const targetPhone = phoneNumber || '+918688664337';
        this.logger.log({ phoneNumber: targetPhone }, 'Starting outbound call');
        const callDoc = await this.callModel.create({
            phoneNumber: targetPhone,
            status: 'initiated',
            startTime: new Date(),
            metadata: {
                assistantId: assistantId ||
                    this.config.get('VAPI_ASSISTANT_ID'),
                callbackId: context?.callbackId,
                originalCallId: context?.originalCallId,
                callbackContext: context
                    ? {
                        transcript: context.transcript,
                        lead: context.lead,
                    }
                    : undefined,
            },
        });
        const lead = await this.leadsService.createInitialLead({
            callId: callDoc._id,
            phoneNumber: targetPhone,
            status: 'IN_PROGRESS',
        });
        callDoc.leadId = lead._id;
        await callDoc.save();
        await this.recordAction(callDoc._id, 'CALL_STARTED', {
            phoneNumber: targetPhone,
            callbackId: context?.callbackId,
            originalCallId: context?.originalCallId,
        });
        try {
            const vapiResult = await this.vapiProvider.startOutboundCall({
                phoneNumber: targetPhone,
                assistantId,
                metadata: {
                    internalCallId: callDoc._id.toString(),
                    leadId: lead._id.toString(),
                    callId: callDoc._id.toString(),
                    callbackId: context?.callbackId,
                    originalCallId: context?.originalCallId,
                    callbackContext: context
                        ? JSON.stringify(context)
                        : undefined,
                },
            });
            callDoc.vapiCallId = vapiResult.vapiCallId;
            callDoc.status = vapiResult.status;
            await callDoc.save();
            this.logger.log({ callId: callDoc._id.toString(), vapiCallId: vapiResult.vapiCallId }, 'Outbound call initiated via Vapi');
            return {
                callId: callDoc._id.toString(),
                vapiCallId: vapiResult.vapiCallId,
                status: callDoc.status,
            };
        }
        catch (err) {
            const errorMsg = err.message;
            callDoc.status = 'failed';
            callDoc.metadata.error = errorMsg;
            await callDoc.save();
            await this.recordAction(callDoc._id, 'ERROR', { error: errorMsg, phase: 'startCall' }, false);
            this.logger.error({ err: errorMsg, callId: callDoc._id.toString() }, 'Vapi call failed to start');
            throw err;
        }
    }
    async getCalls(query) {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.status)
            filter.status = query.status;
        if (query.phoneNumber)
            filter.phoneNumber = query.phoneNumber;
        if (query.startDate || query.endDate) {
            filter.createdAt = {};
            if (query.startDate)
                filter.createdAt.$gte = new Date(query.startDate);
            if (query.endDate)
                filter.createdAt.$lte = new Date(query.endDate);
        }
        const [calls, total] = await Promise.all([
            this.callModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.callModel.countDocuments(filter).exec(),
        ]);
        return { calls, total, page, limit };
    }
    async getCallById(id) {
        const call = await this.callModel.findById(id).exec();
        if (!call)
            throw new common_1.NotFoundException(`Call ${id} not found`);
        return call;
    }
    async getCallByVapiId(vapiCallId) {
        return this.callModel.findOne({ vapiCallId }).exec();
    }
    async updateCallStatus(id, status, extra) {
        const update = { status, ...extra };
        return this.callModel.findByIdAndUpdate(id, update, { new: true }).exec();
    }
    async setVapiCallId(id, vapiCallId) {
        await this.callModel.findByIdAndUpdate(id, { vapiCallId }).exec();
    }
    async saveTranscript(id, transcript) {
        await this.callModel.findByIdAndUpdate(id, { transcript }).exec();
    }
    async endCall(id, duration, summary) {
        const update = {
            status: 'ended',
            endTime: new Date(),
        };
        if (duration !== undefined)
            update.duration = duration;
        if (summary)
            update.summary = summary;
        await this.callModel.findByIdAndUpdate(id, update).exec();
        await this.recordAction(id, 'CALL_ENDED', { duration, summary });
    }
    async getActionsByCallId(id) {
        return this.actionEventModel
            .find({ callId: new mongoose_2.Types.ObjectId(id) })
            .sort({ createdAt: 1 })
            .exec();
    }
    async recordAction(callId, type, data = {}, success = true) {
        return this.actionEventModel.create({
            type: type,
            callId: typeof callId === 'string' ? new mongoose_2.Types.ObjectId(callId) : callId,
            data,
            success,
        });
    }
};
exports.CallsService = CallsService;
exports.CallsService = CallsService = CallsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(call_schema_1.Call.name)),
    __param(1, (0, mongoose_1.InjectModel)(action_event_schema_1.ActionEvent.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        vapi_provider_1.VapiProvider,
        config_1.ConfigService,
        leads_service_1.LeadsService])
], CallsService);
//# sourceMappingURL=calls.service.js.map