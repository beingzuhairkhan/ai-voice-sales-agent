import { ConfigService } from '@nestjs/config';
import { LlmProvider } from '../ai/llm-provider.interface';
import { ExtractedLeadData } from '../ai/lead-extraction.service';
import { LeadTemperature } from '../leads/lead.schema';
export interface QualificationInput {
    extractedData: ExtractedLeadData;
    transcript?: string;
}
export interface QualificationResult {
    temperature: LeadTemperature;
    intentScore: number;
    confidence: number;
    evidence: string[];
    reasoning: string;
    aiSuggestion: {
        temperature: LeadTemperature;
        intentScore: number;
        confidence: number;
        evidence: string[];
        reasoning: string;
    };
}
export declare class QualificationService {
    private llmProvider;
    private config;
    private readonly logger;
    private readonly hotThreshold;
    private readonly warmThreshold;
    constructor(llmProvider: LlmProvider, config: ConfigService);
    qualify(input: QualificationInput): Promise<QualificationResult>;
    private getAiClassification;
    applyDeterministicRules(aiResult: {
        temperature: LeadTemperature;
        intentScore: number;
        confidence: number;
    }, extractedData: ExtractedLeadData): LeadTemperature;
    private deterministicFallback;
}
