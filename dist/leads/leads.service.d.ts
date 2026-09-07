import { Model, Types } from 'mongoose';
import { Lead, LeadTemperature } from './lead.schema';
import { ExtractedLeadData } from '../ai/lead-extraction.service';
export declare class LeadsService {
    private leadModel;
    private readonly logger;
    constructor(leadModel: Model<Lead>);
    createOrUpdateFromExtraction(callId: Types.ObjectId | string, phoneNumber: string, extraction: ExtractedLeadData, rawAiExtraction?: Record<string, any>): Promise<Lead>;
    updateQualification(leadId: Types.ObjectId | string, temperature: LeadTemperature, intentScore: number, confidence: number, evidence: string[], reasoning: string): Promise<Lead>;
    markHotWhatsappSent(leadId: Types.ObjectId | string): Promise<void>;
    hasHotWhatsappBeenSent(leadId: Types.ObjectId | string): Promise<boolean>;
    getLeadById(id: string): Promise<Lead>;
    getLeadByCallId(callId: Types.ObjectId | string): Promise<Lead | null>;
    getLeads(query: {
        page?: number;
        limit?: number;
        temperature?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        leads: Lead[];
        total: number;
        page: number;
        limit: number;
    }>;
}
