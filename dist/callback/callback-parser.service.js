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
var CallbackParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackParserService = void 0;
const common_1 = require("@nestjs/common");
const llm_provider_interface_1 = require("../ai/llm-provider.interface");
const callback_parsing_prompt_1 = require("../ai/prompts/callback-parsing.prompt");
const date_util_1 = require("../common/utils/date.util");
const CALLBACK_SCHEMA = {
    type: 'object',
    properties: {
        parsedDateTime: { type: ['string', 'null'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        timezone: { type: 'string' },
        clarificationNeeded: { type: 'boolean' },
    },
    required: ['parsedDateTime', 'confidence', 'timezone', 'clarificationNeeded'],
};
let CallbackParserService = CallbackParserService_1 = class CallbackParserService {
    constructor(llmProvider, dateUtil) {
        this.llmProvider = llmProvider;
        this.dateUtil = dateUtil;
        this.logger = new common_1.Logger(CallbackParserService_1.name);
    }
    async parseCallbackRequest(naturalPhrase, referenceDate = new Date()) {
        if (!naturalPhrase || naturalPhrase.trim().length === 0) {
            return {
                parsedDateTime: null,
                confidence: 0,
                timezone: 'Asia/Kolkata',
                clarificationNeeded: true,
            };
        }
        let aiResult;
        try {
            aiResult = await this.llmProvider.structuredExtraction({
                messages: [
                    { role: 'system', content: callback_parsing_prompt_1.CALLBACK_PARSING_PROMPT },
                    {
                        role: 'user',
                        content: `Time phrase: "${naturalPhrase}"\nCurrent date/time: ${referenceDate.toISOString()}`,
                    },
                ],
                schema: CALLBACK_SCHEMA,
                temperature: 0.1,
            });
        }
        catch (err) {
            this.logger.error({ err: err.message }, 'AI callback parsing failed, using deterministic fallback');
            const fallback = this.dateUtil.resolveRelativeTime(naturalPhrase, null, referenceDate);
            return {
                parsedDateTime: fallback?.dateTime || null,
                confidence: fallback?.confidence || 0.3,
                timezone: 'Asia/Kolkata',
                clarificationNeeded: !fallback,
            };
        }
        const clarificationNeeded = Boolean(aiResult.clarificationNeeded);
        const aiDateTime = aiResult.parsedDateTime;
        const aiConfidence = Math.max(0, Math.min(1, Number(aiResult.confidence) || 0));
        const deterministic = this.dateUtil.resolveRelativeTime(naturalPhrase, aiDateTime, referenceDate);
        if (clarificationNeeded || !deterministic) {
            return {
                parsedDateTime: null,
                confidence: aiConfidence,
                timezone: 'Asia/Kolkata',
                clarificationNeeded: true,
                rawAiResult: aiResult,
            };
        }
        if (deterministic.dateTime <= referenceDate) {
            this.logger.warn({ parsed: deterministic.dateTime.toISOString() }, 'Parsed callback time is in the past, requesting clarification');
            return {
                parsedDateTime: null,
                confidence: 0.3,
                timezone: 'Asia/Kolkata',
                clarificationNeeded: true,
                rawAiResult: aiResult,
            };
        }
        return {
            parsedDateTime: deterministic.dateTime,
            confidence: Math.max(deterministic.confidence, aiConfidence),
            timezone: 'Asia/Kolkata',
            clarificationNeeded: false,
            rawAiResult: aiResult,
        };
    }
};
exports.CallbackParserService = CallbackParserService;
exports.CallbackParserService = CallbackParserService = CallbackParserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(llm_provider_interface_1.LLM_PROVIDER)),
    __metadata("design:paramtypes", [Object, date_util_1.DateUtil])
], CallbackParserService);
//# sourceMappingURL=callback-parser.service.js.map