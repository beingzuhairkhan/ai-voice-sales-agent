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
var SarvamProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SarvamProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const retry_util_1 = require("../common/utils/retry.util");
let SarvamProvider = SarvamProvider_1 = class SarvamProvider {
    constructor(config, retryUtil) {
        this.config = config;
        this.retryUtil = retryUtil;
        this.logger = new common_1.Logger(SarvamProvider_1.name);
        this.apiKey = this.config.get('SARVAM_API_KEY', '');
        this.sttUrl = this.config.get('SARVAM_STT_API_URL', 'https://api.sarvam.ai/speech-to-text');
        this.ttsUrl = this.config.get('SARVAM_TTS_API_URL', 'https://api.sarvam.ai/text-to-speech');
    }
    async speechToText(params) {
        if (!this.apiKey) {
            throw new Error('SARVAM_API_KEY not configured');
        }
        return this.retryUtil.withRetry(async () => {
            const body = {
                language: params.language || 'auto',
            };
            if (params.audioBase64)
                body.audio_base64 = params.audioBase64;
            if (params.audioUrl)
                body.audio_url = params.audioUrl;
            const response = await fetch(this.sttUrl, {
                method: 'POST',
                headers: {
                    'api-subscription-key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Sarvam STT failed: ${response.status} ${text}`);
            }
            const data = await response.json();
            return {
                transcript: data.transcript || '',
                language: data.language_code || params.language || 'unknown',
                confidence: data.confidence,
            };
        }, { context: 'Sarvam.speechToText' });
    }
    async textToSpeech(params) {
        if (!this.apiKey) {
            throw new Error("SARVAM_API_KEY not configured");
        }
        return this.retryUtil.withRetry(async () => {
            const body = {
                text: params.text,
                target_language_code: params.language || 'hi-IN',
                speaker: params.voice || 'ritu',
                pace: params.speed ?? 0.95,
                model: 'bulbul:v3',
                speech_sample_rate: params.sampleRate || 16000,
                output_audio_codec: 'wav',
            };
            const response = await fetch("https://api.sarvam.ai/text-to-speech", {
                method: "POST",
                headers: {
                    "api-subscription-key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Sarvam TTS failed: ${response.status} ${errorText}`);
            }
            const data = (await response.json());
            if (!data.audios?.[0]) {
                throw new Error("Sarvam TTS returned no audio");
            }
            return {
                audioBase64: data.audios[0],
                format: "wav",
            };
        }, {
            context: "Sarvam.textToSpeech",
        });
    }
};
exports.SarvamProvider = SarvamProvider;
exports.SarvamProvider = SarvamProvider = SarvamProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, retry_util_1.RetryUtil])
], SarvamProvider);
//# sourceMappingURL=sarvam-provider.js.map