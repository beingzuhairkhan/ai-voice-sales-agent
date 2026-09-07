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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CallbackService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const callback_schema_1 = require("./callback.schema");
const callback_parser_service_1 = require("./callback-parser.service");
const calendar_provider_interface_1 = require("../calendar/calendar-provider.interface");
let CallbackService = CallbackService_1 = class CallbackService {
    constructor(callbackModel, parserService, calendarProvider, config) {
        this.callbackModel = callbackModel;
        this.parserService = parserService;
        this.calendarProvider = calendarProvider;
        this.config = config;
        this.logger = new common_1.Logger(CallbackService_1.name);
    }
    async requestCallback(params) {
        const parseResult = await this.parserService.parseCallbackRequest(params.requestedTimePhrase);
        const callback = await this.callbackModel.create({
            leadId: typeof params?.leadId === 'string' ? new mongoose_2.Types.ObjectId(params.leadId) : undefined,
            callId: params.callId
                ? typeof params.callId === 'string'
                    ? new mongoose_2.Types.ObjectId(params.callId)
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
                confirmationMessage: 'I want to make sure I call you at the right time. Could you tell me a more specific day and time? For example, "tomorrow at 10 AM" or "Monday afternoon".',
            };
        }
        const bookingResult = await this.bookCalendarEvent(callback, params.requestedTimePhrase);
        return {
            callback: bookingResult,
            clarificationNeeded: false,
            confirmationMessage: this.buildConfirmationMessage(bookingResult),
        };
    }
    async bookCalendarEvent(callback, contextPhrase) {
        if (!callback.parsedDateTime) {
            this.logger.warn({ callbackId: callback._id?.toString() }, 'Cannot book calendar event without parsed date');
            return callback;
        }
        const startTime = callback.parsedDateTime;
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
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
        }
        catch (err) {
            this.logger.error({ err: err.message }, 'Calendar booking failed');
            callback.status = 'failed';
            callback.notes = `Calendar booking error: ${err.message}`;
            return callback.save();
        }
    }
    buildConfirmationMessage(callback) {
        const dt = callback.parsedDateTime;
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
    async getCallbacks(query) {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.status)
            filter.status = query.status;
        const [callbacks, total] = await Promise.all([
            this.callbackModel.find(filter).sort({ parsedDateTime: 1 }).skip(skip).limit(limit).exec(),
            this.callbackModel.countDocuments(filter).exec(),
        ]);
        return { callbacks, total, page, limit };
    }
};
exports.CallbackService = CallbackService;
exports.CallbackService = CallbackService = CallbackService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(callback_schema_1.Callback.name)),
    __param(2, (0, common_1.Inject)(calendar_provider_interface_1.CALENDAR_PROVIDER)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        callback_parser_service_1.CallbackParserService, Object, config_1.ConfigService])
], CallbackService);
//# sourceMappingURL=callback.service.js.map