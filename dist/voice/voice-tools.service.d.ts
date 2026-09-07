import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Call } from '../calls/call.schema';
import { Lead } from '../leads/lead.schema';
import { ActionEvent } from '../common/types/action-event.schema';
import { LeadsService } from '../leads/leads.service';
import { ConversationsService } from '../conversations/conversations.service';
import { LeadExtractionService } from '../ai/lead-extraction.service';
import { QualificationService } from '../qualification/qualification.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { FollowupService as FollowupGenerationService } from '../ai/followup-generation.service';
import { CallbackService } from '../callback/callback.service';
import { VapiProvider } from '../vapi/vapi-provider';
import { UpdateLeadDto, GetLeadContextDto, EndCallDto } from './dto/voice-tool.dto';
export declare class VoiceToolsService {
    private callModel;
    private leadModel;
    private actionEventModel;
    private leadsService;
    private conversationsService;
    private extractionService;
    private qualificationService;
    private whatsappService;
    private followupGen;
    private callbackService;
    private vapiProvider;
    private config;
    private readonly logger;
    constructor(callModel: Model<Call>, leadModel: Model<Lead>, actionEventModel: Model<ActionEvent>, leadsService: LeadsService, conversationsService: ConversationsService, extractionService: LeadExtractionService, qualificationService: QualificationService, whatsappService: WhatsAppService, followupGen: FollowupGenerationService, callbackService: CallbackService, vapiProvider: VapiProvider, config: ConfigService);
    updateLead(dto: UpdateLeadDto): Promise<{
        success: boolean;
        leadId: string;
        message: string;
    }>;
    sendWhatsapp(dto: any): Promise<{
        success: boolean;
        message: string;
        messageId?: string;
    }>;
    bookCallback(dto: any): Promise<{
        success: boolean;
        clarificationNeeded: boolean;
        confirmationMessage: string;
        callbackId?: string;
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
    private validateActiveCall;
}
