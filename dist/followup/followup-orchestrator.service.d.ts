import { Model, Types } from 'mongoose';
import { Call } from '../calls/call.schema';
import { Lead } from '../leads/lead.schema';
import { ActionEvent } from '../common/types/action-event.schema';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { FollowupService as FollowupGenerationService } from '../ai/followup-generation.service';
import { ConversationsService } from '../conversations/conversations.service';
import { LeadExtractionService } from '../ai/lead-extraction.service';
export declare class FollowupOrchestratorService {
    private callModel;
    private leadModel;
    private actionEventModel;
    private whatsappService;
    private followupGen;
    private conversationsService;
    private extractionService;
    private readonly logger;
    constructor(callModel: Model<Call>, leadModel: Model<Lead>, actionEventModel: Model<ActionEvent>, whatsappService: WhatsAppService, followupGen: FollowupGenerationService, conversationsService: ConversationsService, extractionService: LeadExtractionService);
    processCompletedCall(callId: Types.ObjectId | string): Promise<{
        success: boolean;
        messageSent: boolean;
        error?: string;
    }>;
}
