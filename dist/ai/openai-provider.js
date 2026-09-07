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
var OpenAiProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const retry_util_1 = require("../common/utils/retry.util");
let OpenAiProvider = OpenAiProvider_1 = class OpenAiProvider {
    constructor(config, retryUtil) {
        this.config = config;
        this.retryUtil = retryUtil;
        this.logger = new common_1.Logger(OpenAiProvider_1.name);
        this.sarvamBaseUrl = 'https://api.sarvam.ai/v1';
        this.sarvamApiKey = this.config.get('SARVAM_API_KEY', '');
        this.sarvamModel = this.config.get('SARVAM_MODEL', 'sarvam-105b');
        this.fallbackProvider = this.config.get('LLM_FALLBACK_PROVIDER', 'groq');
        this.groqApiKey = this.config.get('GROQ_API_KEY');
        this.groqModel = this.config.get('GROQ_MODEL', 'llama-3.3-70b-versatile');
    }
    async structuredExtraction(params) {
        try {
            return await this.retryUtil.withRetry(() => this.sarvamStructuredCall(params), {
                maxRetries: 2,
                context: 'Sarvam.structuredExtraction',
            });
        }
        catch (err) {
            if (this.fallbackProvider === 'groq' &&
                this.groqApiKey) {
                this.logger.warn('Sarvam failed, falling back to Groq');
                return this.retryUtil.withRetry(() => this.groqStructuredCall(params), {
                    maxRetries: 2,
                    context: 'Groq.structuredExtraction',
                });
            }
            throw err;
        }
    }
    async chatCompletion(messages, options) {
        try {
            return await this.retryUtil.withRetry(() => this.sarvamChat(messages, options), {
                maxRetries: 2,
                context: 'Sarvam.chatCompletion',
            });
        }
        catch (err) {
            if (this.fallbackProvider === 'groq' &&
                this.groqApiKey) {
                this.logger.warn('Sarvam failed, falling back to Groq');
                return this.retryUtil.withRetry(() => this.groqChat(messages, options), {
                    maxRetries: 2,
                    context: 'Groq.chatCompletion',
                });
            }
            throw err;
        }
    }
    async summarize(transcript, systemPrompt) {
        return this.chatCompletion([
            {
                role: 'system',
                content: systemPrompt,
            },
            {
                role: 'user',
                content: transcript,
            },
        ], {
            temperature: 0.3,
        });
    }
    async sarvamStructuredCall(params) {
        const response = await fetch(`${this.sarvamBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'api-subscription-key': this.sarvamApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: params.model || this.sarvamModel,
                messages: params.messages,
                temperature: params.temperature ?? 0.1,
                max_tokens: 4096,
                response_format: {
                    type: 'json_object',
                },
            }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Sarvam structured call failed: ${response.status} ${text}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('Sarvam returned empty content');
        }
        try {
            return JSON.parse(content);
        }
        catch (err) {
            console.error('SARVAM INVALID JSON:', content);
            throw new Error(`Sarvam returned invalid JSON: ${content}`);
        }
    }
    async sarvamChat(messages, options) {
        const response = await fetch(`${this.sarvamBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'api-subscription-key': this.sarvamApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: options?.model || this.sarvamModel,
                messages,
                temperature: options?.temperature ?? 0.7,
            }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Sarvam chat failed: ${response.status} ${text}`);
        }
        const data = await response.json();
        return (data.choices?.[0]?.message?.content || '');
    }
    async groqStructuredCall(params) {
        const messages = [...params.messages];
        messages.push({
            role: 'system',
            content: `You must respond with valid JSON matching this schema: ` +
                JSON.stringify(params.schema),
        });
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.groqModel,
                messages,
                temperature: params.temperature ?? 0.1,
                response_format: {
                    type: 'json_object',
                },
            }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Groq structured call failed: ${response.status} ${text}`);
        }
        const data = await response.json();
        return JSON.parse(data.choices?.[0]?.message?.content || '{}');
    }
    async groqChat(messages, options) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: options?.model || this.groqModel,
                messages,
                temperature: options?.temperature ?? 0.7,
            }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Groq chat failed: ${response.status} ${text}`);
        }
        const data = await response.json();
        return (data.choices?.[0]?.message?.content || '');
    }
};
exports.OpenAiProvider = OpenAiProvider;
exports.OpenAiProvider = OpenAiProvider = OpenAiProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        retry_util_1.RetryUtil])
], OpenAiProvider);
//# sourceMappingURL=openai-provider.js.map