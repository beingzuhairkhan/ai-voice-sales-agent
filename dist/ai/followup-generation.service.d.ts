import { ConfigService } from '@nestjs/config';
import { LlmProvider } from './llm-provider.interface';
import { ExtractedLeadData } from './lead-extraction.service';
export interface FollowupGenerationParams {
    transcript: string;
    extractedData?: ExtractedLeadData;
    temperature: string;
}
export declare class FollowupService {
    private llmProvider;
    private config;
    private readonly logger;
    private readonly developerName;
    private readonly developerMobile;
    constructor(llmProvider: LlmProvider, config: ConfigService);
    private readonly resumeUrl;
    private readonly systemOverviewUrl;
    generateFollowup(params: FollowupGenerationParams): Promise<string>;
    private fallbackMessage;
}
