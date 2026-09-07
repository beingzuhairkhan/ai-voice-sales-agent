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
exports.CallsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const calls_service_1 = require("./calls.service");
const call_dto_1 = require("./dto/call.dto");
let CallsController = class CallsController {
    constructor(callsService) {
        this.callsService = callsService;
    }
    async startCall(dto) {
        return this.callsService.startCall(dto.phoneNumber, dto.assistantId);
    }
    async getCalls(query) {
        return this.callsService.getCalls(query);
    }
    async getCall(id) {
        return this.callsService.getCallById(id);
    }
    async getTranscript(id) {
        const call = await this.callsService.getCallById(id);
        return { callId: id, transcript: call.transcript || '', language: call.language };
    }
    async getLead(id) {
        const call = await this.callsService.getCallById(id);
        return { callId: id, leadId: call.leadId };
    }
    async getActions(id) {
        return this.callsService.getActionsByCallId(id);
    }
};
exports.CallsController = CallsController;
__decorate([
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start an outbound call (defaults to +918688664337)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [call_dto_1.StartCallDto]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "startCall", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List calls with pagination and filters' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [call_dto_1.CallQueryDto]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getCalls", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single call by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getCall", null);
__decorate([
    (0, common_1.Get)(':id/transcript'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the transcript for a call' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getTranscript", null);
__decorate([
    (0, common_1.Get)(':id/lead'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the lead associated with a call' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getLead", null);
__decorate([
    (0, common_1.Get)(':id/actions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get action events for a call' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CallsController.prototype, "getActions", null);
exports.CallsController = CallsController = __decorate([
    (0, swagger_1.ApiTags)('Calls'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('calls'),
    __metadata("design:paramtypes", [calls_service_1.CallsService])
], CallsController);
//# sourceMappingURL=calls.controller.js.map