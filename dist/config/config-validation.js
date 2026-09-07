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
exports.ConfigValidation = ConfigValidation;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class EnvVariables {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "NODE_ENV", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EnvVariables.prototype, "PORT", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "MONGODB_URI", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "REDIS_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "JWT_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "VAPI_API_KEY", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "VAPI_ASSISTANT_ID", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "VAPI_PHONE_NUMBER", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "SARVAM_API_KEY", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "OPENAI_API_KEY", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "OPENAI_MODEL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "WHATSAPP_ACCESS_TOKEN", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "WHATSAPP_PHONE_NUMBER_ID", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "WHATSAPP_API_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "GOOGLE_CLIENT_ID", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "GOOGLE_CLIENT_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "GOOGLE_REFRESH_TOKEN", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "GOOGLE_CALENDAR_ID", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "DEVELOPER_NAME", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "DEVELOPER_MOBILE_NUMBER", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], EnvVariables.prototype, "HOT_SCORE_THRESHOLD", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], EnvVariables.prototype, "WARM_SCORE_THRESHOLD", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "CALLBACK_DEFAULT_MORNING_TIME", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "CALLBACK_DEFAULT_AFTERNOON_TIME", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "CALLBACK_DEFAULT_EVENING_TIME", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvVariables.prototype, "CALLBACK_TIMEZONE", void 0);
const NUMERIC_KEYS = [
    'PORT', 'HOT_SCORE_THRESHOLD', 'WARM_SCORE_THRESHOLD',
    'JWT_EXPIRES_IN', 'MAX_RETRIES', 'RETRY_BASE_DELAY_MS', 'HTTP_TIMEOUT_MS',
];
const BOOLEAN_KEYS = ['VAPI_WEBHOOK_VERIFY_ENABLED'];
function ConfigValidation(rawConfig) {
    const coerced = {};
    for (const key of Object.keys(process.env)) {
        let value = process.env[key];
        if (NUMERIC_KEYS.includes(key) && value !== undefined)
            value = Number(value);
        if (BOOLEAN_KEYS.includes(key) && value !== undefined)
            value = value === 'true';
        coerced[key] = value;
    }
    const isProduction = coerced.NODE_ENV === 'production';
    const isTest = coerced.NODE_ENV === 'test';
    if (!isTest) {
        const validated = (0, class_transformer_1.plainToInstance)(EnvVariables, coerced, { enableImplicitConversion: true });
        const errors = (0, class_validator_1.validateSync)(validated, { skipMissingProperties: true });
        if (errors.length > 0) {
            const messages = errors
                .map((e) => `Missing or invalid env var: ${e.property} - ${JSON.stringify(e.constraints)}`)
                .join('\n');
            if (isProduction) {
                throw new Error('Environment variable validation failed:\n' + messages);
            }
            else {
                console.warn('Environment variable validation warnings:\n' + messages);
            }
        }
    }
    return coerced;
}
//# sourceMappingURL=config-validation.js.map