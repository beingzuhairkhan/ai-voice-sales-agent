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
var RetryUtil_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryUtil = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RetryUtil = RetryUtil_1 = class RetryUtil {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(RetryUtil_1.name);
        this.defaultMaxRetries = this.config.get('MAX_RETRIES', 3);
        this.defaultBaseDelay = this.config.get('RETRY_BASE_DELAY_MS', 500);
    }
    async withRetry(fn, options = {}, context = 'external') {
        const maxRetries = options.maxRetries ?? this.defaultMaxRetries;
        const baseDelay = options.baseDelayMs ?? this.defaultBaseDelay;
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
                    this.logger.warn({ err: error.message, attempt, nextRetryMs: Math.round(delay), context }, `${context} call failed, retrying`);
                    await this.sleep(delay);
                }
            }
        }
        throw lastError;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.RetryUtil = RetryUtil;
exports.RetryUtil = RetryUtil = RetryUtil_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RetryUtil);
//# sourceMappingURL=retry.util.js.map