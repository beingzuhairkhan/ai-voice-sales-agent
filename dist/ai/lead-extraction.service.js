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
var LeadExtractionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadExtractionService = exports.EXTRACTION_SCHEMA = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const llm_provider_interface_1 = require("./llm-provider.interface");
const lead_extraction_prompt_1 = require("./prompts/lead-extraction.prompt");
const conversation_message_schema_1 = require("../conversations/conversation-message.schema");
const EMPTY_EXTRACTION = {
    name: null,
    productDescription: null,
    productCount: null,
    budget: null,
    currency: null,
    timeline: null,
    requiredFeatures: [],
    painPoints: [],
    isDecisionMaker: null,
    barriers: [],
    objections: [],
    buyingSignals: [],
    language: 'unknown',
};
exports.EXTRACTION_SCHEMA = {
    type: 'object',
    properties: {
        name: { type: ['string', 'null'] },
        productDescription: { type: ['string', 'null'] },
        productCount: { type: ['number', 'null'] },
        budget: { type: ['number', 'null'] },
        currency: { type: ['string', 'null'] },
        timeline: { type: ['string', 'null'] },
        requiredFeatures: { type: 'array', items: { type: 'string' } },
        painPoints: { type: 'array', items: { type: 'string' } },
        isDecisionMaker: { type: ['boolean', 'null'] },
        barriers: { type: 'array', items: { type: 'string' } },
        objections: { type: 'array', items: { type: 'string' } },
        buyingSignals: { type: 'array', items: { type: 'string' } },
        language: { type: 'string' },
    },
    required: [
        'name',
        'productDescription',
        'productCount',
        'budget',
        'currency',
        'timeline',
        'requiredFeatures',
        'painPoints',
        'isDecisionMaker',
        'barriers',
        'objections',
        'buyingSignals',
        'language',
    ],
};
let LeadExtractionService = LeadExtractionService_1 = class LeadExtractionService {
    constructor(llmProvider, config, conversationModel) {
        this.llmProvider = llmProvider;
        this.config = config;
        this.conversationModel = conversationModel;
        this.logger = new common_1.Logger(LeadExtractionService_1.name);
    }
    async extractFromConversation(callId) {
        const messages = await this.conversationModel
            .find({ callId: typeof callId === 'string' ? new mongoose_2.Types.ObjectId(callId) : callId })
            .sort({ timestamp: 1 })
            .exec();
        if (messages.length === 0) {
            this.logger.warn({ callId: callId.toString() }, 'No conversation messages found for extraction');
            return { ...EMPTY_EXTRACTION };
        }
        console.log("extractFromConversation", messages);
        const transcript = messages
            .map((m) => `${m.role.toUpperCase()}: ${m.message}`)
            .join('\n');
        return this.extractFromTranscript(transcript);
    }
    async extractFromTranscript(transcript) {
        if (!transcript || transcript.trim().length === 0) {
            return { ...EMPTY_EXTRACTION };
        }
        try {
            const result = await this.llmProvider.structuredExtraction({
                messages: [
                    { role: 'system', content: lead_extraction_prompt_1.LEAD_EXTRACTION_PROMPT },
                    { role: 'user', content: `Conversation transcript:\n\n${transcript}` },
                ],
                schema: exports.EXTRACTION_SCHEMA,
                temperature: 0.1,
            });
            console.log("result", result);
            return this.validateExtraction(result);
        }
        catch (err) {
            this.logger.error({ err: err.message }, 'Lead extraction failed');
            return { ...EMPTY_EXTRACTION };
        }
    }
    validateExtraction(raw) {
        return {
            name: typeof raw.name === 'string' ? raw.name : null,
            productDescription: typeof raw.productDescription === 'string' ? raw.productDescription : null,
            productCount: typeof raw.productCount === 'number' ? raw.productCount : null,
            budget: typeof raw.budget === 'number' ? raw.budget : null,
            currency: typeof raw.currency === 'string' ? raw.currency : null,
            timeline: typeof raw.timeline === 'string' ? raw.timeline : null,
            requiredFeatures: Array.isArray(raw.requiredFeatures) ? raw.requiredFeatures.filter((x) => typeof x === 'string') : [],
            painPoints: Array.isArray(raw.painPoints) ? raw.painPoints.filter((x) => typeof x === 'string') : [],
            isDecisionMaker: typeof raw.isDecisionMaker === 'boolean' ? raw.isDecisionMaker : null,
            barriers: Array.isArray(raw.barriers) ? raw.barriers.filter((x) => typeof x === 'string') : [],
            objections: Array.isArray(raw.objections) ? raw.objections.filter((x) => typeof x === 'string') : [],
            buyingSignals: Array.isArray(raw.buyingSignals) ? raw.buyingSignals.filter((x) => typeof x === 'string') : [],
            language: typeof raw.language === 'string' ? raw.language : 'unknown',
        };
    }
};
exports.LeadExtractionService = LeadExtractionService;
exports.LeadExtractionService = LeadExtractionService = LeadExtractionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(llm_provider_interface_1.LLM_PROVIDER)),
    __param(2, (0, mongoose_1.InjectModel)(conversation_message_schema_1.ConversationMessage.name)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService,
        mongoose_2.Model])
], LeadExtractionService);
//# sourceMappingURL=lead-extraction.service.js.map