import { Document, Types } from 'mongoose';
export type LeadTemperature = 'HOT' | 'WARM' | 'COLD' | 'UNKNOWN';
export type LeadDocument = Lead & Document;
export declare class Lead {
    _id: Types.ObjectId;
    callId: Types.ObjectId;
    phoneNumber: string;
    name?: string | null;
    temperature: LeadTemperature;
    intentScore: number;
    confidence: number;
    budget?: number | null;
    currency?: string | null;
    productDescription?: string | null;
    productCount?: number | null;
    timeline?: string | null;
    requiredFeatures: string[];
    painPoints: string[];
    isDecisionMaker?: boolean | null;
    barriers: string[];
    objections: string[];
    buyingSignals: string[];
    language: string;
    rawAiExtraction: Record<string, any>;
    evidence: string[];
    reasoning?: string | null;
    hotWhatsappSent: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const LeadSchema: import("mongoose").Schema<Lead, import("mongoose").Model<Lead, any, any, any, Document<unknown, any, Lead, any, {}> & Lead & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Lead, Document<unknown, {}, import("mongoose").FlatRecord<Lead>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Lead> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
