import { VoiceToolsService } from './voice-tools.service';
import { UpdateLeadDto, GetLeadContextDto, EndCallDto } from './dto/voice-tool.dto';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { SarvamProvider } from '@/sarvam/sarvam-provider';
import type { Response } from 'express';
import { FollowupService as FollowupGenerationService } from '../ai/followup-generation.service';
import { LlmProvider } from '@/ai/llm-provider.interface';
export declare class VoiceToolsController {
    private voiceToolsService;
    private sarvamTtsService;
    private config;
    private followupGen;
    private llmProvider;
    constructor(voiceToolsService: VoiceToolsService, sarvamTtsService: SarvamProvider, config: ConfigService, followupGen: FollowupGenerationService, llmProvider: LlmProvider);
    updateLead(dto: UpdateLeadDto): Promise<{
        success: boolean;
        leadId: string;
        message: string;
    }>;
    sendWhatsapp(body: any, headers: Record<string, string>, req: Request): Promise<{
        success: boolean;
        message: string;
        messageId?: string;
    } | {
        status: string;
    }>;
    bookCallback(body: any, headers: Record<string, string>, req: Request): Promise<{
        success: boolean;
        clarificationNeeded: boolean;
        confirmationMessage: string;
        callbackId?: string;
    } | {
        status: string;
    }>;
    getLeadContext(dto: GetLeadContextDto): Promise<{
        leadId: string;
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
        temperature: string;
        intentScore: number;
        hotWhatsappSent: boolean;
        language: string;
    }>;
    endCall(dto: EndCallDto): Promise<{
        success: boolean;
        message: string;
    }>;
    sarvamTts(body: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
