"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const mongoose_1 = require("@nestjs/mongoose");
const nestjs_pino_1 = require("nestjs-pino");
const common_module_1 = require("./common/common.module");
const config_validation_1 = require("./config/config-validation");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const calls_module_1 = require("./calls/calls.module");
const voice_module_1 = require("./voice/voice.module");
const vapi_module_1 = require("./vapi/vapi.module");
const sarvam_module_1 = require("./sarvam/sarvam.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const conversations_module_1 = require("./conversations/conversations.module");
const leads_module_1 = require("./leads/leads.module");
const qualification_module_1 = require("./qualification/qualification.module");
const ai_module_1 = require("./ai/ai.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const callback_module_1 = require("./callback/callback.module");
const calendar_module_1 = require("./calendar/calendar.module");
const followup_module_1 = require("./followup/followup.module");
const jobs_module_1 = require("./jobs/jobs.module");
const files_module_1 = require("./files/files.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const health_module_1 = require("./health/health.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validate: config_validation_1.ConfigValidation,
            }),
            nestjs_pino_1.LoggerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    pinoHttp: {
                        level: config.get('NODE_ENV') === 'production' ? 'info' : 'debug',
                        transport: config.get('NODE_ENV') !== 'production'
                            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
                            : undefined,
                        redact: {
                            paths: [
                                'req.headers.authorization',
                                'req.headers["authorization"]',
                                'req.headers.cookie',
                                '*.apiKey',
                                '*.api_key',
                                '*.accessToken',
                                '*.access_token',
                                '*.refreshToken',
                                '*.refresh_token',
                                '*.password',
                                '*.token',
                            ],
                            censor: '[REDACTED]',
                        },
                        genReqCustomProps: (req) => ({
                            requestId: req.headers['x-request-id'] || req.id,
                        }),
                    },
                }),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: () => [{ ttl: 60000, limit: 100 }],
            }),
            mongoose_1.MongooseModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    uri: config.get('MONGODB_URI'),
                }),
            }),
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            calls_module_1.CallsModule,
            voice_module_1.VoiceModule,
            vapi_module_1.VapiModule,
            sarvam_module_1.SarvamModule,
            webhooks_module_1.WebhooksModule,
            conversations_module_1.ConversationsModule,
            leads_module_1.LeadsModule,
            qualification_module_1.QualificationModule,
            ai_module_1.AiModule,
            whatsapp_module_1.WhatsAppModule,
            callback_module_1.CallbackModule,
            calendar_module_1.CalendarModule,
            followup_module_1.FollowupModule,
            jobs_module_1.JobsModule,
            files_module_1.FilesModule,
            dashboard_module_1.DashboardModule,
            health_module_1.HealthModule,
        ],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map