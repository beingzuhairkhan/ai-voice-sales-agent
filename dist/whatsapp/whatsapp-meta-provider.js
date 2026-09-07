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
var WhatsAppMetaProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppMetaProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const retry_util_1 = require("../common/utils/retry.util");
let WhatsAppMetaProvider = WhatsAppMetaProvider_1 = class WhatsAppMetaProvider {
    constructor(config, retryUtil) {
        this.config = config;
        this.retryUtil = retryUtil;
        this.logger = new common_1.Logger(WhatsAppMetaProvider_1.name);
        this.accessToken = this.config.get('WHATSAPP_ACCESS_TOKEN', '');
        this.phoneNumberId = this.config.get('WHATSAPP_PHONE_NUMBER_ID', '');
        this.apiUrl = this.config.get('WHATSAPP_API_URL', 'https://graph.facebook.com/v20.0');
    }
    async sendTextMessage(to, body) {
        return this.retryUtil.withRetry(async () => {
            const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: this.normalizeNumber(to),
                    type: 'text',
                    text: { body, preview_url: false },
                }),
            });
            return this.parseResponse(response);
        }, { maxRetries: 2, context: 'WhatsApp.sendText' });
    }
    async sendDocument(to, documentUrl, caption) {
        return this.retryUtil.withRetry(async () => {
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: this.normalizeNumber(to),
                type: 'document',
                document: { link: documentUrl, caption },
            };
            const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(payload),
            });
            return this.parseResponse(response);
        }, { maxRetries: 2, context: 'WhatsApp.sendDocument' });
    }
    async sendImage(to, imageUrl, caption) {
        return this.retryUtil.withRetry(async () => {
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: this.normalizeNumber(to),
                type: 'image',
                image: { link: imageUrl, caption },
            };
            const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(payload),
            });
            return this.parseResponse(response);
        }, { maxRetries: 2, context: 'WhatsApp.sendImage' });
    }
    headers() {
        return {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
        };
    }
    normalizeNumber(phone) {
        let num = phone.replace(/[^\d]/g, '');
        if (num.startsWith('91') && num.length === 12)
            return num;
        if (num.length === 10)
            return `91${num}`;
        return num;
    }
    async parseResponse(response) {
        const data = await response.json();
        if (!response.ok) {
            const errMsg = data?.error?.message || `HTTP ${response.status}`;
            throw new Error(`WhatsApp send failed: ${errMsg}`);
        }
        const messageId = data?.messages?.[0]?.id || 'unknown';
        return { providerMessageId: messageId, status: 'sent', rawResponse: data };
    }
};
exports.WhatsAppMetaProvider = WhatsAppMetaProvider;
exports.WhatsAppMetaProvider = WhatsAppMetaProvider = WhatsAppMetaProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, retry_util_1.RetryUtil])
], WhatsAppMetaProvider);
//# sourceMappingURL=whatsapp-meta-provider.js.map