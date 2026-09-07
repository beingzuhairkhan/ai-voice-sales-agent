"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoogleCalendarProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const retry_util_1 = require("../common/utils/retry.util");
let GoogleCalendarProvider = GoogleCalendarProvider_1 = class GoogleCalendarProvider {
    constructor(config, retryUtil) {
        this.config = config;
        this.retryUtil = retryUtil;
        this.logger = new common_1.Logger(GoogleCalendarProvider_1.name);
        this.oauth2Client = null;
        this.calendarId = this.config.get('GOOGLE_CALENDAR_ID', 'primary');
    }
    onModuleInit() {
        const clientId = this.config.get('GOOGLE_CLIENT_ID', '');
        const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET', '');
        const refreshToken = this.config.get('GOOGLE_REFRESH_TOKEN', '');
        if (clientId && clientSecret && refreshToken) {
            this.oauth2Client = new google_auth_library_1.OAuth2Client(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
            this.oauth2Client.setCredentials({ refresh_token: refreshToken });
            this.logger.log('Google Calendar OAuth2 client initialized');
        }
        else {
            this.logger.warn('Google Calendar credentials not fully configured — calendar features disabled');
        }
    }
    getCalendar() {
        if (!this.oauth2Client) {
            throw new Error('Google Calendar not configured — missing OAuth2 credentials');
        }
        return googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
    }
    async createEvent(params) {
        const calendar = this.getCalendar();
        const tz = params.timezone || this.config.get('GOOGLE_TIMEZONE', 'Asia/Kolkata');
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
                eventId: event.data.id,
                htmlLink: event.data.htmlLink,
            };
        }, { maxRetries: 2, context: 'GoogleCalendar.createEvent' });
    }
    async updateEvent(eventId, params) {
        const calendar = this.getCalendar();
        const tz = params.timezone || this.config.get('GOOGLE_TIMEZONE', 'Asia/Kolkata');
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
                eventId: event.data.id,
                htmlLink: event.data.htmlLink,
            };
        }, { maxRetries: 2, context: 'GoogleCalendar.updateEvent' });
    }
    async cancelEvent(eventId) {
        const calendar = this.getCalendar();
        await this.retryUtil.withRetry(async () => {
            await calendar.events.delete({ calendarId: this.calendarId, eventId });
        }, { maxRetries: 1, context: 'GoogleCalendar.cancelEvent' });
    }
};
exports.GoogleCalendarProvider = GoogleCalendarProvider;
exports.GoogleCalendarProvider = GoogleCalendarProvider = GoogleCalendarProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, retry_util_1.RetryUtil])
], GoogleCalendarProvider);
//# sourceMappingURL=google-calendar-provider.js.map