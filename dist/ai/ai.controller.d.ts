import { LeadExtractionService } from './lead-extraction.service';
import { QualificationService } from '../qualification/qualification.service';
import { FollowupService } from './followup-generation.service';
import { LlmProvider } from './llm-provider.interface';
declare class ExtractLeadDto {
    transcript: string;
}
declare class ClassifyLeadDto {
    name?: string | null;
    productDescription?: string | null;
    productCount?: number | null;
    budget?: number | null;
    currency?: string | null;
    timeline?: string | null;
    requiredFeatures?: string[];
    painPoints?: string[];
    isDecisionMaker?: boolean | null;
    barriers?: string[];
    objections?: string[];
    buyingSignals?: string[];
    language?: string;
    transcript?: string;
}
declare class GenerateFollowupDto {
    transcript: string;
    name?: string | null;
    productDescription?: string | null;
    budget?: number | null;
    currency?: string | null;
    timeline?: string | null;
    requiredFeatures?: string[];
    painPoints?: string[];
    barriers?: string[];
    isDecisionMaker?: boolean | null;
    language?: string;
    temperature?: string;
}
export declare class AiController {
    private extractionService;
    private qualificationService;
    private followupService;
    private llmProvider;
    constructor(extractionService: LeadExtractionService, qualificationService: QualificationService, followupService: FollowupService, llmProvider: LlmProvider);
    extractLead(dto: ExtractLeadDto): Promise<import("./lead-extraction.service").ExtractedLeadData>;
    classifyLead(dto: ClassifyLeadDto): Promise<import("../qualification/qualification.service").QualificationResult>;
    generateFollowup(dto: GenerateFollowupDto): Promise<{
        message: string;
    }>;
}
export {};
