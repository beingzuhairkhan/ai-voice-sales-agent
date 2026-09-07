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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtil = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let DateUtil = class DateUtil {
    constructor(config) {
        this.config = config;
    }
    resolveRelativeTime(naturalPhrase, parsedDateTime, referenceDate = new Date()) {
        if (parsedDateTime) {
            const date = new Date(parsedDateTime);
            if (!isNaN(date.getTime())) {
                return { dateTime: date, confidence: 0.9 };
            }
        }
        const phrase = naturalPhrase.toLowerCase();
        const now = new Date(referenceDate);
        const tz = this.config.get('CALLBACK_TIMEZONE', 'Asia/Kolkata');
        const morningTime = this.config.get('CALLBACK_DEFAULT_MORNING_TIME', '10:00');
        const afternoonTime = this.config.get('CALLBACK_DEFAULT_AFTERNOON_TIME', '14:00');
        const eveningTime = this.config.get('CALLBACK_DEFAULT_EVENING_TIME', '18:00');
        const daysMatch = phrase.match(/(\d+)\s*day/);
        const tomorrow = /tomorrow|kal|next day/.test(phrase);
        const nextWeek = /next week/.test(phrase);
        const monday = /monday|somvar/.test(phrase);
        const tuesday = /tuesday|mangalvar/.test(phrase);
        const wednesday = /wednesday|budhvar/.test(phrase);
        const thursday = /thursday|guruvar/.test(phrase);
        const friday = /friday|shukravar/.test(phrase);
        const saturday = /saturday|shanivar/.test(phrase);
        const sunday = /sunday|ravivar/.test(phrase);
        let targetDate = new Date(now);
        if (daysMatch) {
            targetDate.setDate(targetDate.getDate() + parseInt(daysMatch[1], 10));
        }
        else if (tomorrow) {
            targetDate.setDate(targetDate.getDate() + 1);
        }
        else if (nextWeek) {
            targetDate.setDate(targetDate.getDate() + 7);
        }
        else if (monday) {
            targetDate = this.nextWeekday(targetDate, 1);
        }
        else if (tuesday) {
            targetDate = this.nextWeekday(targetDate, 2);
        }
        else if (wednesday) {
            targetDate = this.nextWeekday(targetDate, 3);
        }
        else if (thursday) {
            targetDate = this.nextWeekday(targetDate, 4);
        }
        else if (friday) {
            targetDate = this.nextWeekday(targetDate, 5);
        }
        else if (saturday) {
            targetDate = this.nextWeekday(targetDate, 6);
        }
        else if (sunday) {
            targetDate = this.nextWeekday(targetDate, 0);
        }
        else if (!phrase.includes('today') && !phrase.includes('aaj')) {
            return null;
        }
        let timeStr = morningTime;
        let confidence = 0.7;
        if (/morning|subah|savere/.test(phrase)) {
            timeStr = morningTime;
            confidence = 0.75;
        }
        else if (/afternoon|dopehar/.test(phrase)) {
            timeStr = afternoonTime;
            confidence = 0.75;
        }
        else if (/evening|shaam|sandhya/.test(phrase)) {
            timeStr = eveningTime;
            confidence = 0.75;
        }
        else {
            const explicitTime = phrase.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
            if (explicitTime) {
                let hour = parseInt(explicitTime[1], 10);
                const minute = explicitTime[2] ? parseInt(explicitTime[2], 10) : 0;
                const ampm = explicitTime[3];
                if (ampm === 'pm' && hour < 12)
                    hour += 12;
                if (ampm === 'am' && hour === 12)
                    hour = 0;
                targetDate.setHours(hour, minute, 0, 0);
                return { dateTime: new Date(targetDate), confidence: 0.85 };
            }
            confidence = 0.5;
        }
        const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
        targetDate.setHours(h, m, 0, 0);
        this.logger_log(`Resolved "${naturalPhrase}" to ${targetDate.toISOString()} (tz=${tz})`);
        return { dateTime: new Date(targetDate), confidence };
    }
    nextWeekday(from, targetDay) {
        const date = new Date(from);
        const currentDay = date.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0)
            diff += 7;
        date.setDate(date.getDate() + diff);
        return date;
    }
    logger_log(msg) {
        if (process.env.NODE_ENV !== 'test')
            console.log(`[DateUtil] ${msg}`);
    }
};
exports.DateUtil = DateUtil;
exports.DateUtil = DateUtil = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DateUtil);
//# sourceMappingURL=date.util.js.map