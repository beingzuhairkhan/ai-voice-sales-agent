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
exports.VoiceToolsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const voice_tools_service_1 = require("./voice-tools.service");
const voice_tool_dto_1 = require("./dto/voice-tool.dto");
const voice_tool_auth_guard_1 = require("../common/guards/voice-tool-auth.guard");
const public_decorator_1 = require("../common/decorators/public.decorator");
const config_1 = require("@nestjs/config");
let VoiceToolsController = class VoiceToolsController {
    constructor(voiceToolsService, config) {
        this.voiceToolsService = voiceToolsService;
        this.config = config;
    }
    async updateLead(dto) {
        return this.voiceToolsService.updateLead(dto);
    }
    async sendWhatsapp(body, headers, req) {
        console.log('SEND WHATSAPP BODY:', body);
        console.log('SEND WHATSAPP HEADERS:', headers);
        const expectedSecret = this.config.get('VAPI_WEBHOOK_SECRET');
        if (expectedSecret) {
            const authorization = headers['authorization'];
            const expectedAuthorization = `Bearer ${expectedSecret}`;
            if (authorization !== expectedAuthorization) {
                console.log('SEND WHATSAPP: UNAUTHORIZED');
                return { status: 'unauthorized' };
            }
        }
        console.log('SEND WHATSAPP: CALLING SERVICE');
        const result = await this.voiceToolsService.sendWhatsapp(body);
        console.log('SEND WHATSAPP RESULT:', result);
        return result;
    }
    async bookCallback(body, headers, req) {
        const expectedSecret = this.config.get('VAPI_WEBHOOK_SECRET');
        if (expectedSecret) {
            const authorization = headers['authorization'];
            const expectedAuthorization = `Bearer ${expectedSecret}`;
            if (authorization !== expectedAuthorization) {
                req.log?.warn({
                    hasAuthorization: !!authorization,
                }, 'Vapi webhook secret mismatch');
                return { status: 'unauthorized' };
            }
        }
        return this.voiceToolsService.bookCallback(body);
    }
    async getLeadContext(dto) {
        return this.voiceToolsService.getLeadContext(dto);
    }
    async endCall(dto) {
        return this.voiceToolsService.endCall(dto);
    }
};
exports.VoiceToolsController = VoiceToolsController;
__decorate([
    (0, common_1.Post)('update-lead'),
    (0, swagger_1.ApiOperation)({ summary: 'Vapi tool: update lead information during call' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [voice_tool_dto_1.UpdateLeadDto]),
    __metadata("design:returntype", Promise)
], VoiceToolsController.prototype, "updateLead", null);
__decorate([
    (0, common_1.Post)('send-whatsapp'),
    (0, swagger_1.ApiOperation)({ summary: 'Vapi tool: send WhatsApp message during call (HOT lead only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceToolsController.prototype, "sendWhatsapp", null);
__decorate([
    (0, common_1.Post)('book-callback'),
    (0, swagger_1.ApiOperation)({ summary: 'Vapi tool: schedule a callback' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], VoiceToolsController.prototype, "bookCallback", null);
__decorate([
    (0, common_1.Post)('get-lead-context'),
    (0, swagger_1.ApiOperation)({ summary: 'Vapi tool: get current lead context' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [voice_tool_dto_1.GetLeadContextDto]),
    __metadata("design:returntype", Promise)
], VoiceToolsController.prototype, "getLeadContext", null);
__decorate([
    (0, common_1.Post)('end-call'),
    (0, swagger_1.ApiOperation)({ summary: 'Vapi tool: end the active call' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [voice_tool_dto_1.EndCallDto]),
    __metadata("design:returntype", Promise)
], VoiceToolsController.prototype, "endCall", null);
exports.VoiceToolsController = VoiceToolsController = __decorate([
    (0, swagger_1.ApiTags)('Voice Tools'),
    (0, common_1.Controller)('voice/tools'),
    (0, common_1.UseGuards)(voice_tool_auth_guard_1.VoiceToolAuthGuard),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [voice_tools_service_1.VoiceToolsService,
        config_1.ConfigService])
], VoiceToolsController);
//# sourceMappingURL=voice-tools.controller.js.map