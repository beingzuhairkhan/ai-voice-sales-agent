import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Callback } from './callback.schema';
import { CallbackParserService } from './callback-parser.service';
import { CalendarProvider } from '../calendar/calendar-provider.interface';
export declare class CallbackService {
    private callbackModel;
    private parserService;
    private calendarProvider;
    private config;
    private readonly logger;
    constructor(callbackModel: Model<Callback>, parserService: CallbackParserService, calendarProvider: CalendarProvider, config: ConfigService);
    requestCallback(params: {
        leadId?: Types.ObjectId | string;
        callId?: Types.ObjectId | string;
        requestedTimePhrase: string;
        reason?: string;
    }): Promise<{
        callback: Callback;
        clarificationNeeded: boolean;
        confirmationMessage: string;
    }>;
    bookCalendarEvent(callback: any, contextPhrase?: string): Promise<Callback>;
    private buildConfirmationMessage;
    getCallbacks(query: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        callbacks: Callback[];
        total: number;
        page: number;
        limit: number;
    }>;
}
