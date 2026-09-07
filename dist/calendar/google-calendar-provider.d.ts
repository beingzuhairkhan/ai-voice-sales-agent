import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetryUtil } from '../common/utils/retry.util';
import { CalendarEventParams, CalendarEventResult, CalendarProvider } from './calendar-provider.interface';
export declare class GoogleCalendarProvider implements CalendarProvider, OnModuleInit {
    private config;
    private retryUtil;
    private readonly logger;
    private oauth2Client;
    private calendarId;
    constructor(config: ConfigService, retryUtil: RetryUtil);
    onModuleInit(): void;
    private getCalendar;
    createEvent(params: CalendarEventParams): Promise<CalendarEventResult>;
    updateEvent(eventId: string, params: Partial<CalendarEventParams>): Promise<CalendarEventResult>;
    cancelEvent(eventId: string): Promise<void>;
}
