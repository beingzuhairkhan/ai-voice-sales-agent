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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
let WhatsAppController = class WhatsAppController {
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    verifyWebhook(mode, token, challenge) {
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
        if (mode === 'subscribe' &&
            token === verifyToken) {
            return challenge;
        }
        throw new common_1.UnauthorizedException();
    }
    async whatsappWebhook(body) {
        console.log('Received WhatsApp webhook:', body);
        if (body?.object !==
            'whatsapp_business_account') {
            return { success: true };
        }
        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                const statuses = change.value?.statuses || [];
                for (const status of statuses) {
                    await this.whatsappService.handleStatusWebhook(status);
                }
            }
        }
        return { success: true };
    }
    async testSendMessage() {
        const phoneNumber = '919967705134';
        const message = `Hi Rahul, thanks for your enquiry.

You are looking to build an e-commerce website for an electronics business.

Your budget is around 52,000–60,000 INR and you're looking to launch within 1 week.

You mentioned that you need online payments and WhatsApp integration.

You can reach me directly on +91 9967705134 to discuss.`;
        const result = await this.whatsappService.sendTextMessage(phoneNumber, message, {
            triggerAction: 'test_send',
        });
        return {
            success: true,
            data: result,
        };
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, common_1.Get)('webhooks/whatsapp'),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WhatsAppController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Post)('webhooks/whatsapp'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "whatsappWebhook", null);
__decorate([
    (0, common_1.Post)('test-send'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "testSendMessage", null);
exports.WhatsAppController = WhatsAppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map