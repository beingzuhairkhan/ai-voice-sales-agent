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
var VapiProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VapiProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const retry_util_1 = require("../common/utils/retry.util");
let VapiProvider = VapiProvider_1 = class VapiProvider {
    constructor(config, retryUtil) {
        this.config = config;
        this.retryUtil = retryUtil;
        this.logger = new common_1.Logger(VapiProvider_1.name);
        this.baseUrl = 'https://api.vapi.ai';
        this.apiKey = this.config.get('VAPI_API_KEY', '');
        this.assistantId = this.config.get('VAPI_ASSISTANT_ID', '');
        this.phoneNumberId = this.config.get('VAPI_PHONE_NUMBER_ID');
        this.callerNumber = this.config.get('VAPI_PHONE_NUMBER');
    }
    async startOutboundCall(params) {
        const body = {
            assistantId: params.assistantId || this.assistantId,
            customer: {
                number: params.phoneNumber,
            },
        };
        if (params.phoneNumberId || this.phoneNumberId) {
            body.phoneNumberId = params.phoneNumberId || this.phoneNumberId;
        }
        if (params.metadata) {
            body.metadata = params.metadata;
        }
        return this.retryUtil.withRetry(async () => {
            const response = await fetch(`${this.baseUrl}/call`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Vapi startOutboundCall failed: ${response.status} ${text}`);
            }
            const data = await response.json();
            return {
                vapiCallId: data.id,
                status: data.status || 'initiated',
                metadata: data,
            };
        }, { context: 'Vapi.startOutboundCall' });
    }
    async getCall(vapiCallId) {
        return this.retryUtil.withRetry(async () => {
            const response = await fetch(`${this.baseUrl}/call/${vapiCallId}`, {
                method: 'GET',
                headers: this.headers(),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Vapi getCall failed: ${response.status} ${text}`);
            }
            const data = await response.json();
            return this.mapCallInfo(data);
        }, { context: 'Vapi.getCall' });
    }
    async createAssistant(config) {
        return this.retryUtil.withRetry(async () => {
            const response = await fetch(`${this.baseUrl}/assistant`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(config),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Vapi createAssistant failed: ${response.status} ${text}`);
            }
            const data = await response.json();
            return { id: data.id };
        }, { context: 'Vapi.createAssistant' });
    }
    async updateAssistant(assistantId, config) {
        await this.retryUtil.withRetry(async () => {
            const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
                method: 'PATCH',
                headers: this.headers(),
                body: JSON.stringify(config),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Vapi updateAssistant failed: ${response.status} ${text}`);
            }
        }, { context: 'Vapi.updateAssistant' });
    }
    async endCall(vapiCallId) {
        await this.retryUtil.withRetry(async () => {
            const response = await fetch(`${this.baseUrl}/call/${vapiCallId}`, {
                method: 'DELETE',
                headers: this.headers(),
            });
            if (!response.ok && response.status !== 404) {
                const text = await response.text();
                throw new Error(`Vapi endCall failed: ${response.status} ${text}`);
            }
        }, { maxRetries: 1, context: 'Vapi.endCall' });
    }
    headers() {
        return {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };
    }
    mapCallInfo(data) {
        return {
            id: data.id,
            status: data.status,
            transcript: data.transcript,
            recordingUrl: data.recordingUrl,
            startedAt: data.startedAt,
            endedAt: data.endedAt,
            durationSeconds: data.durationSeconds,
            metadata: data.metadata,
        };
    }
};
exports.VapiProvider = VapiProvider;
exports.VapiProvider = VapiProvider = VapiProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, retry_util_1.RetryUtil])
], VapiProvider);
//# sourceMappingURL=vapi-provider.js.map