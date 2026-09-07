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
var ConversationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const conversation_message_schema_1 = require("./conversation-message.schema");
let ConversationsService = ConversationsService_1 = class ConversationsService {
    constructor(messageModel) {
        this.messageModel = messageModel;
        this.logger = new common_1.Logger(ConversationsService_1.name);
    }
    async addMessage(params) {
        if (params.providerEventId) {
            const existing = await this.messageModel.findOne({ providerEventId: params.providerEventId }).exec();
            if (existing)
                return existing;
        }
        return this.messageModel.create({
            callId: typeof params.callId === 'string' ? new mongoose_2.Types.ObjectId(params.callId) : params.callId,
            role: params.role,
            message: params.message,
            language: params.language || 'unknown',
            providerEventId: params.providerEventId,
            metadata: params.metadata || {},
        });
    }
    async getConversation(callId) {
        return this.messageModel
            .find({ callId: typeof callId === 'string' ? new mongoose_2.Types.ObjectId(callId) : callId })
            .sort({ timestamp: 1 })
            .exec();
    }
    async getTranscriptText(callId) {
        const messages = await this.getConversation(callId);
        return messages.map((m) => `${m.role.toUpperCase()}: ${m.message}`).join('\n');
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = ConversationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(conversation_message_schema_1.ConversationMessage.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map