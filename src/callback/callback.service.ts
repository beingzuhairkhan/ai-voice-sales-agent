import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Callback } from './callback.schema';
import { CallbackParserService } from './callback-parser.service';
import { CalendarProvider, CALENDAR_PROVIDER } from '../calendar/calendar-provider.interface';

@Injectable()
export class CallbackService {
  private readonly logger = new Logger(CallbackService.name);

  constructor(
    @InjectModel(Callback.name) private callbackModel: Model<Callback>,
    private parserService: CallbackParserService,
    @Inject(CALENDAR_PROVIDER) private calendarProvider: CalendarProvider,
    private config: ConfigService,
  ) {}

  async requestCallback(params: {
    leadId?: Types.ObjectId | string;
    callId?: Types.ObjectId | string;
    requestedTimePhrase: string;
    reason?: string;
  }): Promise<{ callback: Callback; clarificationNeeded: boolean; confirmationMessage: string }> {
    const parseResult = await this.parserService.parseCallbackRequest(params.requestedTimePhrase);

    const callback: any = await this.callbackModel.create({
      leadId: typeof params?.leadId === 'string' ? new Types.ObjectId(params.leadId) : undefined,
      callId: params.callId
        ? typeof params.callId === 'string'
          ? new Types.ObjectId(params.callId)
          : params.callId
        : undefined,
      requestedTimePhrase: params.requestedTimePhrase,
      parsedDateTime: parseResult.parsedDateTime || undefined,
      timezone: parseResult.timezone,
      confidence: parseResult.confidence,
      status: parseResult.clarificationNeeded ? 'requested' : 'confirmed',
      reason: params.reason,
    });

    if (parseResult.clarificationNeeded) {
      return {
        callback,
        clarificationNeeded: true,
        confirmationMessage:
          'I want to make sure I call you at the right time. Could you tell me a more specific day and time? For example, "tomorrow at 10 AM" or "Monday afternoon".',
      };
    }

    // Book the calendar event immediately for confirmed callbacks
    const bookingResult = await this.bookCalendarEvent(callback, params.requestedTimePhrase);

    return {
      callback: bookingResult,
      clarificationNeeded: false,
      confirmationMessage: this.buildConfirmationMessage(bookingResult),
    };
  }

  async bookCalendarEvent(callback: any, contextPhrase?: string): Promise<Callback> {
    if (!callback.parsedDateTime) {
      this.logger.warn({ callbackId: callback._id?.toString() }, 'Cannot book calendar event without parsed date');
      return callback;
    }

    const startTime = callback.parsedDateTime;
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30-min callback slot

    try {
      const event = await this.calendarProvider.createEvent({
        summary: 'Sales Callback - E-commerce Website Development',
        description: `Callback requested by customer.\nOriginal request: "${contextPhrase || callback.requestedTimePhrase}"\nLead ID: ${callback.leadId}`,
        startTime,
        endTime,
        timezone: callback.timezone,
      });

      callback.googleCalendarEventId = event.eventId;
      callback.status = 'scheduled';
      callback.notes = `Calendar event: ${event.htmlLink}`;
      return callback.save();
    } catch (err) {
      this.logger.error({ err: (err as Error).message }, 'Calendar booking failed');
      callback.status = 'failed';
      callback.notes = `Calendar booking error: ${(err as Error).message}`;
      return callback.save();
    }
  }

  private buildConfirmationMessage(callback: Callback): string {
    const dt = callback.parsedDateTime!;
    const dateStr = dt.toLocaleString('en-IN', {
      timeZone: callback.timezone,
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Perfect! I've scheduled a callback for ${dateStr}. You'll get a call from us at that time. Thank you!`;
  }

  async getCallbacks(query: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ callbacks: Callback[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;

    const [callbacks, total] = await Promise.all([
      this.callbackModel.find(filter).sort({ parsedDateTime: 1 }).skip(skip).limit(limit).exec(),
      this.callbackModel.countDocuments(filter).exec(),
    ]);

    return { callbacks, total, page, limit };
  }
}
