import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { LlmProvider } from './llm-provider.interface';
import { ConversationMessage } from '../conversations/conversation-message.schema';
export interface ExtractedLeadData {
    name: string | null;
    productDescription: string | null;
    productCount: number | null;
    budget: number | null;
    currency: string | null;
    timeline: string | null;
    requiredFeatures: string[];
    painPoints: string[];
    isDecisionMaker: boolean | null;
    barriers: string[];
    objections: string[];
    buyingSignals: string[];
    language: string;
}
export declare const EXTRACTION_SCHEMA: {
    type: string;
    properties: {
        name: {
            type: string[];
        };
        productDescription: {
            type: string[];
        };
        productCount: {
            type: string[];
        };
        budget: {
            type: string[];
        };
        currency: {
            type: string[];
        };
        timeline: {
            type: string[];
        };
        requiredFeatures: {
            type: string;
            items: {
                type: string;
            };
        };
        painPoints: {
            type: string;
            items: {
                type: string;
            };
        };
        isDecisionMaker: {
            type: string[];
        };
        barriers: {
            type: string;
            items: {
                type: string;
            };
        };
        objections: {
            type: string;
            items: {
                type: string;
            };
        };
        buyingSignals: {
            type: string;
            items: {
                type: string;
            };
        };
        language: {
            type: string;
        };
    };
    required: string[];
};
export declare class LeadExtractionService {
    private llmProvider;
    private config;
    private conversationModel;
    private readonly logger;
    constructor(llmProvider: LlmProvider, config: ConfigService, conversationModel: Model<ConversationMessage>);
    extractFromConversation(callId: Types.ObjectId | string): Promise<ExtractedLeadData>;
    extractFromTranscript(transcript: string): Promise<ExtractedLeadData>;
    validateExtraction(raw: Record<string, any>): ExtractedLeadData;
}
