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
var LeadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const lead_schema_1 = require("./lead.schema");
let LeadsService = LeadsService_1 = class LeadsService {
    constructor(leadModel) {
        this.leadModel = leadModel;
        this.logger = new common_1.Logger(LeadsService_1.name);
    }
    async createOrUpdateFromExtraction(callId, phoneNumber, extraction, rawAiExtraction) {
        const callObjectId = typeof callId === 'string' ? new mongoose_2.Types.ObjectId(callId) : callId;
        let lead = await this.leadModel.findOne({ callId: callObjectId }).exec();
        const updateData = {
            name: extraction.name,
            productDescription: extraction.productDescription,
            productCount: extraction.productCount,
            budget: extraction.budget,
            currency: extraction.currency,
            timeline: extraction.timeline,
            requiredFeatures: extraction.requiredFeatures,
            painPoints: extraction.painPoints,
            isDecisionMaker: extraction.isDecisionMaker,
            barriers: extraction.barriers,
            objections: extraction.objections,
            buyingSignals: extraction.buyingSignals,
            language: extraction.language,
            rawAiExtraction: rawAiExtraction || extraction,
        };
        if (lead) {
            updateData.requiredFeatures = [...new Set([...lead.requiredFeatures, ...extraction.requiredFeatures])];
            updateData.painPoints = [...new Set([...lead.painPoints, ...extraction.painPoints])];
            updateData.barriers = [...new Set([...lead.barriers, ...extraction.barriers])];
            updateData.objections = [...new Set([...lead.objections, ...extraction.objections])];
            updateData.buyingSignals = [...new Set([...lead.buyingSignals, ...extraction.buyingSignals])];
            for (const key of ['name', 'productDescription', 'productCount', 'budget', 'currency', 'timeline', 'isDecisionMaker']) {
                if (updateData[key] === null || updateData[key] === undefined) {
                    updateData[key] = lead[key];
                }
            }
            Object.assign(lead, updateData);
            return lead.save();
        }
        lead = new this.leadModel({
            callId: callObjectId,
            phoneNumber,
            temperature: 'UNKNOWN',
            intentScore: 0,
            confidence: 0,
            ...updateData,
        });
        return lead.save();
    }
    async updateQualification(leadId, temperature, intentScore, confidence, evidence, reasoning) {
        const lead = await this.leadModel
            .findByIdAndUpdate(leadId, { temperature, intentScore, confidence, evidence, reasoning }, { new: true })
            .exec();
        if (!lead)
            throw new common_1.NotFoundException(`Lead ${leadId} not found`);
        return lead;
    }
    async markHotWhatsappSent(leadId) {
        await this.leadModel.findByIdAndUpdate(leadId, { hotWhatsappSent: true }).exec();
    }
    async hasHotWhatsappBeenSent(leadId) {
        const lead = await this.leadModel.findById(leadId).select('hotWhatsappSent').exec();
        return Boolean(lead?.hotWhatsappSent);
    }
    async getLeadById(id) {
        const lead = await this.leadModel.findById(id).exec();
        if (!lead)
            throw new common_1.NotFoundException(`Lead ${id} not found`);
        return lead;
    }
    async getLeadByCallId(callId) {
        const callObjectId = typeof callId === 'string' ? new mongoose_2.Types.ObjectId(callId) : callId;
        const lead = await this.leadModel
            .findOne({ callId: callObjectId })
            .exec();
        return lead;
    }
    async getLeads(query) {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.temperature)
            filter.temperature = query.temperature;
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { phoneNumber: { $regex: query.search, $options: 'i' } },
                { productDescription: { $regex: query.search, $options: 'i' } },
            ];
        }
        if (query.startDate || query.endDate) {
            filter.createdAt = {};
            if (query.startDate)
                filter.createdAt.$gte = new Date(query.startDate);
            if (query.endDate)
                filter.createdAt.$lte = new Date(query.endDate);
        }
        const [leads, total] = await Promise.all([
            this.leadModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.leadModel.countDocuments(filter).exec(),
        ]);
        return { leads, total, page, limit };
    }
    async createInitialLead(params) {
        return this.leadModel.create({
            callId: params.callId,
            phoneNumber: params.phoneNumber,
            status: params.status,
            budget: null,
            products: null,
            productCount: null,
            timeline: null,
            features: [],
            temperature: null,
            intentScore: null,
            confidence: null,
            hotWhatsappSent: false,
            createdAt: new Date(),
        });
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = LeadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(lead_schema_1.Lead.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LeadsService);
//# sourceMappingURL=leads.service.js.map