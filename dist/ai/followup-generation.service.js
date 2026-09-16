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
var FollowupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const llm_provider_interface_1 = require("./llm-provider.interface");
const followup_generation_prompt_1 = require("./prompts/followup-generation.prompt");
let FollowupService = FollowupService_1 = class FollowupService {
    constructor(llmProvider, config) {
        this.llmProvider = llmProvider;
        this.config = config;
        this.logger = new common_1.Logger(FollowupService_1.name);
        this.resumeUrl = "https://drive.google.com/file/d/1rEZr_JxMN_yIG9MDYelJKn_hO9XWkYIl/view";
        this.systemOverviewUrl = "https://drive.google.com/file/d/1rEZr_JxMN_yIG9MDYelJKn_hO9XWkYIl/view";
        this.developerName = this.config.get('DEVELOPER_NAME', 'Developer');
        this.developerMobile = this.config.get('DEVELOPER_MOBILE_NUMBER', '');
    }
    async generateFollowup(params) {
        const { transcript, extractedData, temperature } = params;
        const leadSummary = JSON.stringify({
            name: extractedData?.name,
            productDescription: extractedData?.productDescription,
            productCount: extractedData?.productCount,
            budget: extractedData?.budget,
            currency: extractedData?.currency,
            timeline: extractedData?.timeline,
            requiredFeatures: extractedData?.requiredFeatures,
            painPoints: extractedData?.painPoints,
            barriers: extractedData?.barriers,
            isDecisionMaker: extractedData?.isDecisionMaker,
            temperature,
            language: extractedData?.language,
        }, null, 2);
        const userContent = `
Developer mobile: ${this.developerMobile}

Resume URL:
${this.resumeUrl}

System overview URL:
${this.systemOverviewUrl}

Lead information:
${leadSummary}

Conversation transcript:
${transcript}

Extract the WhatsApp template parameters according to the system instructions.

Return ONLY valid JSON.
`;
        try {
            const message = await this.llmProvider.chatCompletion([
                { role: 'system', content: followup_generation_prompt_1.FOLLOWUP_GENERATION_PROMPT },
                { role: 'user', content: userContent },
            ], { temperature: 0.7 });
            if (!message || message.trim().length === 0) {
                return this.fallbackMessage(extractedData);
            }
            let finalMessage = message.trim();
            if (!finalMessage.includes(this.developerMobile)) {
                finalMessage += `\n\nContact: ${this.developerName} — ${this.developerMobile}`;
            }
            return finalMessage;
        }
        catch (err) {
            this.logger.error({ err: err.message }, 'Followup generation failed, using fallback');
            return this.fallbackMessage(extractedData);
        }
    }
    fallbackMessage(extractedData) {
        const data = extractedData || {};
        const businessName = data.name || data.productDescription || "your business";
        const productCount = data.productCount || "the required";
        const budget = data.budget || "to be discussed";
        const timeline = data.timeline || "to be discussed";
        const rawFeatures = data.requiredFeatures;
        const requiredFeatures = (rawFeatures && typeof rawFeatures === 'string' && rawFeatures.trim().length > 0)
            ? rawFeatures
            : (Array.isArray(rawFeatures) && rawFeatures.length > 0)
                ? rawFeatures.join(', ')
                : "the required features";
        console.log('Fallback follow-up message:');
        return JSON.stringify({
            businessName,
            productCount,
            budget,
            timeline,
            requiredFeatures,
            developerMobile: this.developerMobile,
            resumeUrl: this.resumeUrl,
            systemOverviewUrl: this.systemOverviewUrl,
        }, null, 2);
    }
};
exports.FollowupService = FollowupService;
exports.FollowupService = FollowupService = FollowupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(llm_provider_interface_1.LLM_PROVIDER)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], FollowupService);
//# sourceMappingURL=followup-generation.service.js.map