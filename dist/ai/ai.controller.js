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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const lead_extraction_service_1 = require("./lead-extraction.service");
const qualification_service_1 = require("../qualification/qualification.service");
const followup_generation_service_1 = require("./followup-generation.service");
const common_2 = require("@nestjs/common");
const llm_provider_interface_1 = require("./llm-provider.interface");
class ExtractLeadDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExtractLeadDto.prototype, "transcript", void 0);
class ClassifyLeadDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], ClassifyLeadDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], ClassifyLeadDto.prototype, "productDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], ClassifyLeadDto.prototype, "productCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], ClassifyLeadDto.prototype, "budget", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], ClassifyLeadDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], ClassifyLeadDto.prototype, "timeline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ClassifyLeadDto.prototype, "requiredFeatures", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ClassifyLeadDto.prototype, "painPoints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], ClassifyLeadDto.prototype, "isDecisionMaker", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ClassifyLeadDto.prototype, "barriers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ClassifyLeadDto.prototype, "objections", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ClassifyLeadDto.prototype, "buyingSignals", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClassifyLeadDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClassifyLeadDto.prototype, "transcript", void 0);
class GenerateFollowupDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateFollowupDto.prototype, "transcript", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], GenerateFollowupDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], GenerateFollowupDto.prototype, "productDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], GenerateFollowupDto.prototype, "budget", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], GenerateFollowupDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], GenerateFollowupDto.prototype, "timeline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], GenerateFollowupDto.prototype, "requiredFeatures", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], GenerateFollowupDto.prototype, "painPoints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], GenerateFollowupDto.prototype, "barriers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], GenerateFollowupDto.prototype, "isDecisionMaker", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateFollowupDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateFollowupDto.prototype, "temperature", void 0);
let AiController = class AiController {
    constructor(extractionService, qualificationService, followupService, llmProvider) {
        this.extractionService = extractionService;
        this.qualificationService = qualificationService;
        this.followupService = followupService;
        this.llmProvider = llmProvider;
    }
    async extractLead(dto) {
        return this.extractionService.extractFromTranscript(dto.transcript);
    }
    async classifyLead(dto) {
        return this.qualificationService.qualify({
            extractedData: {
                name: dto.name || null,
                productDescription: dto.productDescription || null,
                productCount: dto.productCount || null,
                budget: dto.budget || null,
                currency: dto.currency || null,
                timeline: dto.timeline || null,
                requiredFeatures: dto.requiredFeatures || [],
                painPoints: dto.painPoints || [],
                isDecisionMaker: dto.isDecisionMaker ?? null,
                barriers: dto.barriers || [],
                objections: dto.objections || [],
                buyingSignals: dto.buyingSignals || [],
                language: dto.language || 'unknown',
            },
            transcript: dto.transcript,
        });
    }
    async generateFollowup(dto) {
        const message = await this.followupService.generateFollowup({
            transcript: dto.transcript,
            extractedData: {
                name: dto.name || null,
                productDescription: dto.productDescription || null,
                productCount: null,
                budget: dto.budget || null,
                currency: dto.currency || null,
                timeline: dto.timeline || null,
                requiredFeatures: dto.requiredFeatures || [],
                painPoints: dto.painPoints || [],
                isDecisionMaker: dto.isDecisionMaker ?? null,
                barriers: dto.barriers || [],
                objections: [],
                buyingSignals: [],
                language: dto.language || 'en',
            },
            temperature: dto.temperature || 'WARM',
        });
        return { message };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('extract-lead'),
    (0, swagger_1.ApiOperation)({ summary: 'Extract lead data from a transcript (admin testing)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ExtractLeadDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "extractLead", null);
__decorate([
    (0, common_1.Post)('classify-lead'),
    (0, swagger_1.ApiOperation)({ summary: 'Classify a lead as HOT/WARM/COLD (admin testing)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ClassifyLeadDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "classifyLead", null);
__decorate([
    (0, common_1.Post)('generate-followup'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a follow-up message (admin testing)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GenerateFollowupDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateFollowup", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI (Admin Testing)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('ai'),
    __param(3, (0, common_2.Inject)(llm_provider_interface_1.LLM_PROVIDER)),
    __metadata("design:paramtypes", [lead_extraction_service_1.LeadExtractionService,
        qualification_service_1.QualificationService,
        followup_generation_service_1.FollowupService, Object])
], AiController);
//# sourceMappingURL=ai.controller.js.map