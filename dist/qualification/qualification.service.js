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
var QualificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const llm_provider_interface_1 = require("../ai/llm-provider.interface");
const lead_classification_prompt_1 = require("../ai/prompts/lead-classification.prompt");
const CLASSIFICATION_SCHEMA = {
    type: 'object',
    properties: {
        temperature: { type: 'string', enum: ['HOT', 'WARM', 'COLD'] },
        intentScore: { type: 'number', minimum: 0, maximum: 100 },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        evidence: { type: 'array', items: { type: 'string' } },
        reasoning: { type: 'string' },
    },
    required: ['temperature', 'intentScore', 'confidence', 'evidence', 'reasoning'],
};
let QualificationService = QualificationService_1 = class QualificationService {
    constructor(llmProvider, config) {
        this.llmProvider = llmProvider;
        this.config = config;
        this.logger = new common_1.Logger(QualificationService_1.name);
        this.hotThreshold = this.config.get('HOT_SCORE_THRESHOLD', 75);
        this.warmThreshold = this.config.get('WARM_SCORE_THRESHOLD', 45);
    }
    async qualify(input) {
        const aiResult = await this.getAiClassification(input);
        const finalTemperature = this.applyDeterministicRules(aiResult, input.extractedData);
        return {
            temperature: finalTemperature,
            intentScore: aiResult.intentScore,
            confidence: aiResult.confidence,
            evidence: aiResult.evidence,
            reasoning: aiResult.reasoning,
            aiSuggestion: {
                temperature: aiResult.temperature,
                intentScore: aiResult.intentScore,
                confidence: aiResult.confidence,
                evidence: aiResult.evidence,
                reasoning: aiResult.reasoning,
            },
        };
    }
    async getAiClassification(input) {
        try {
            console.log("extracted data before passing to ai ", input.extractedData, input.transcript);
            const userContent = JSON.stringify({
                extractedLead: input.extractedData,
                transcript: input.transcript || 'not provided',
            });
            const result = await this.llmProvider.structuredExtraction({
                messages: [
                    { role: 'system', content: lead_classification_prompt_1.LEAD_CLASSIFICATION_PROMPT },
                    { role: 'user', content: userContent },
                ],
                schema: CLASSIFICATION_SCHEMA,
                temperature: 0.2,
            });
            console.log("AI classification result: ", result);
            const temperature = result.temperature || 'COLD';
            const intentScore = Math.max(0, Math.min(100, Math.round(Number(result.intentScore) || 0)));
            const confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0));
            const evidence = Array.isArray(result.evidence) ? result.evidence : [];
            const reasoning = typeof result.reasoning === 'string' ? result.reasoning : '';
            return { temperature, intentScore, confidence, evidence, reasoning };
        }
        catch (err) {
            this.logger.error({ err: err.message }, 'AI classification failed, using deterministic fallback');
            return this.deterministicFallback(input.extractedData);
        }
    }
    applyDeterministicRules(aiResult, extractedData) {
        const score = aiResult.intentScore;
        if (extractedData.buyingSignals.length === 0 &&
            !extractedData.productDescription &&
            !extractedData.timeline &&
            !extractedData.budget) {
            return 'COLD';
        }
        if (score >= this.hotThreshold)
            return 'HOT';
        if (score >= this.warmThreshold)
            return 'WARM';
        return 'COLD';
    }
    deterministicFallback(data) {
        let score = 20;
        const evidence = [];
        if (data.buyingSignals.length > 0) {
            score += 15 * data.buyingSignals.length;
            evidence.push(...data.buyingSignals);
        }
        if (data.budget) {
            score += 15;
            evidence.push(`Budget mentioned: ${data.budget} ${data.currency || ''}`);
        }
        if (data.timeline) {
            score += 10;
            evidence.push(`Timeline: ${data.timeline}`);
        }
        if (data.productDescription) {
            score += 10;
            evidence.push(`Products: ${data.productDescription}`);
        }
        if (data.isDecisionMaker === true) {
            score += 10;
            evidence.push('Is decision maker');
        }
        if (data.barriers.length > 0) {
            score -= 10;
            evidence.push(`Barriers: ${data.barriers.join(', ')}`);
        }
        if (data.objections.length > 0) {
            score -= 5;
            evidence.push(`Objections: ${data.objections.join(', ')}`);
        }
        score = Math.max(0, Math.min(100, score));
        const temperature = score >= this.hotThreshold ? 'HOT' : score >= this.warmThreshold ? 'WARM' : 'COLD';
        return {
            temperature,
            intentScore: score,
            confidence: 0.5,
            evidence,
            reasoning: 'Deterministic fallback: score based on extracted signals and barriers.',
        };
    }
};
exports.QualificationService = QualificationService;
exports.QualificationService = QualificationService = QualificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(llm_provider_interface_1.LLM_PROVIDER)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], QualificationService);
//# sourceMappingURL=qualification.service.js.map