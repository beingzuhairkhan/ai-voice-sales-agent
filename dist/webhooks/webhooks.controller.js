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
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const webhooks_service_1 = require("./webhooks.service");
const public_decorator_1 = require("../common/decorators/public.decorator");
const config_1 = require("@nestjs/config");
let WebhooksController = class WebhooksController {
    constructor(webhooksService, config) {
        this.webhooksService = webhooksService;
        this.config = config;
    }
    async listEvents(page, limit, search, status) {
        return this.webhooksService.listEvents({
            page: Number(page) || 1,
            limit: Number(limit) || 15,
            search,
            status,
        });
    }
    async handleVapiWebhook(body, headers, req) {
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
        const result = await this.webhooksService.handleVapiWebhook(body);
        return result;
    }
    async debugEndOfCall(callId) {
        if (!callId) {
            return {
                status: 'failed',
                message: 'callId is required',
            };
        }
        return this.webhooksService.debugHandleEndOfCall(callId);
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({
        summary: 'List stored webhook events',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        example: 1,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        example: 15,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        example: '',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        example: '',
    }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "listEvents", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('vapi'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Vapi webhook receiver — call status, transcripts, tool calls, end-of-call reports',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleVapiWebhook", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('vapi/debug/end-of-call'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'DEBUG: Replay end-of-call processing from stored Vapi event',
    }),
    __param(0, (0, common_1.Body)('callId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "debugEndOfCall", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, swagger_1.ApiTags)('Webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService,
        config_1.ConfigService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map