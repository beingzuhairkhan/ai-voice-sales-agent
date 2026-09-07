export interface CalendarEventParams {
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: Array<{
        email: string;
    }>;
    timezone?: string;
}
export interface CalendarEventResult {
    eventId: string;
    htmlLink: string;
}
export interface CalendarProvider {
    createEvent(params: CalendarEventParams): Promise<CalendarEventResult>;
    updateEvent(eventId: string, params: Partial<CalendarEventParams>): Promise<CalendarEventResult>;
    cancelEvent(eventId: string): Promise<void>;
}
export declare const CALENDAR_PROVIDER = "CALENDAR_PROVIDER";
