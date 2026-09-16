import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Call, CallStatus } from './call.schema';
import { VapiProvider } from '../vapi/vapi-provider';
import { ActionEvent } from '../common/types/action-event.schema';
import { LeadsService } from '@/leads/leads.service';
export declare class CallsService {
    private callModel;
    private actionEventModel;
    private vapiProvider;
    private config;
    private leadsService;
    private readonly logger;
    private readonly defaultPhoneNumber;
    constructor(callModel: Model<Call>, actionEventModel: Model<ActionEvent>, vapiProvider: VapiProvider, config: ConfigService, leadsService: LeadsService);
    startCall(phoneNumber?: string, assistantId?: string, context?: {
        callbackId?: string;
        originalCallId?: string;
        transcript?: string;
        lead?: any;
    }): Promise<{
        callId: string;
        vapiCallId: string;
        status: string;
    }>;
    getCalls(query: {
        page?: number;
        limit?: number;
        status?: string;
        phoneNumber?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        calls: Call[];
        total: number;
        page: number;
        limit: number;
    }>;
    getCallById(id: string): Promise<Call>;
    getCallByVapiId(vapiCallId: string): Promise<Call | null>;
    updateCallStatus(id: Types.ObjectId | string, status: CallStatus, extra?: Partial<Call>): Promise<Call | null>;
    setVapiCallId(id: Types.ObjectId | string, vapiCallId: string): Promise<void>;
    saveTranscript(id: Types.ObjectId | string, transcript: string): Promise<void>;
    endCall(id: Types.ObjectId | string, duration?: number, summary?: string): Promise<void>;
    getActionsByCallId(id: string): Promise<ActionEvent[]>;
    recordAction(callId: Types.ObjectId | string, type: string, data?: Record<string, any>, success?: boolean): Promise<ActionEvent>;
    getAllActions(page?: number, limit?: number, search?: string, status?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, ActionEvent, {}, {}> & ActionEvent & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
