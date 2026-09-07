import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { RetryUtil } from '../common/utils/retry.util';
import {
  CalendarEventParams,
  CalendarEventResult,
  CalendarProvider,
} from './calendar-provider.interface';

/**
 * Google Calendar adapter.
 * Uses OAuth2 refresh token to obtain access tokens.
 * Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_CALENDAR_ID
 */
@Injectable()
export class GoogleCalendarProvider implements CalendarProvider, OnModuleInit {
  private readonly logger = new Logger(GoogleCalendarProvider.name);
  private oauth2Client: OAuth2Client | null = null;
  private calendarId: string;

  constructor(private config: ConfigService, private retryUtil: RetryUtil) {
    this.calendarId = this.config.get<string>('GOOGLE_CALENDAR_ID', 'primary');
  }

  onModuleInit() {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID', '');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET', '');
    const refreshToken = this.config.get<string>('GOOGLE_REFRESH_TOKEN', '');

    if (clientId && clientSecret && refreshToken) {
      this.oauth2Client = new OAuth2Client(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      this.logger.log('Google Calendar OAuth2 client initialized');
    } else {
      this.logger.warn('Google Calendar credentials not fully configured — calendar features disabled');
    }
  }

  private getCalendar() {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar not configured — missing OAuth2 credentials');
    }
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async createEvent(params: CalendarEventParams): Promise<CalendarEventResult> {
    const calendar = this.getCalendar();
    const tz = params.timezone || this.config.get<string>('GOOGLE_TIMEZONE', 'Asia/Kolkata');

    return this.retryUtil.withRetry(async () => {
      const event = await calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: {
          summary: params.summary,
          description: params.description,
          start: { dateTime: params.startTime.toISOString(), timeZone: tz },
          end: { dateTime: params.endTime.toISOString(), timeZone: tz },
          attendees: params.attendees,
          reminders: { useDefault: true },
        },
      });
      return {
        eventId: event.data.id!,
        htmlLink: event.data.htmlLink!,
      };
    }, { maxRetries: 2, context: 'GoogleCalendar.createEvent' });
  }

  async updateEvent(eventId: string, params: Partial<CalendarEventParams>): Promise<CalendarEventResult> {
    const calendar = this.getCalendar();
    const tz = params.timezone || this.config.get<string>('GOOGLE_TIMEZONE', 'Asia/Kolkata');

    return this.retryUtil.withRetry(async () => {
      const event = await calendar.events.patch({
        calendarId: this.calendarId,
        eventId,
        requestBody: {
          summary: params.summary,
          description: params.description,
          start: params.startTime ? { dateTime: params.startTime.toISOString(), timeZone: tz } : undefined,
          end: params.endTime ? { dateTime: params.endTime.toISOString(), timeZone: tz } : undefined,
        },
      });
      return {
        eventId: event.data.id!,
        htmlLink: event.data.htmlLink!,
      };
    }, { maxRetries: 2, context: 'GoogleCalendar.updateEvent' });
  }

  async cancelEvent(eventId: string): Promise<void> {
    const calendar = this.getCalendar();
    await this.retryUtil.withRetry(async () => {
      await calendar.events.delete({ calendarId: this.calendarId, eventId });
    }, { maxRetries: 1, context: 'GoogleCalendar.cancelEvent' });
  }
}
