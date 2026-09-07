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
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const common_2 = require("@nestjs/common");
const whatsapp_message_schema_1 = require("./whatsapp-message.schema");
const whatsapp_provider_interface_1 = require("./whatsapp-provider.interface");
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    constructor(messageModel, provider, config) {
        this.messageModel = messageModel;
        this.provider = provider;
        this.config = config;
        this.logger = new common_1.Logger(WhatsAppService_1.name);
        this.resumeUrl = this.config.get('RESUME_URL', '');
        this.architectureImageUrl = this.config.get('ARCHITECTURE_IMAGE_URL', '');
    }
    async sendTextMessage(phoneNumber, message, options) {
        const record = await this.messageModel.create({
            phoneNumber,
            message,
            type: 'text',
            status: 'queued',
            leadId: options?.leadId
                ? typeof options.leadId === 'string'
                    ? new mongoose_2.Types.ObjectId(options.leadId)
                    : options.leadId
                : undefined,
            triggerAction: options?.triggerAction,
        });
        try {
            const result = await this.provider.sendTextMessage(phoneNumber, message);
            record.providerMessageId = result.providerMessageId;
            record.status = 'sent';
            record.sentAt = new Date();
            record.deliveryInfo = result.rawResponse || {};
            return record.save();
        }
        catch (err) {
            const errorMsg = err.message;
            record.status = 'failed';
            record.errorInfo = { message: errorMsg, timestamp: new Date().toISOString() };
            await record.save();
            this.logger.error({ err: errorMsg, phoneNumber }, 'WhatsApp text send failed');
            throw err;
        }
    }
    async sendDocument(phoneNumber, documentUrl, caption, options) {
        const record = await this.messageModel.create({
            phoneNumber,
            message: caption || documentUrl,
            type: 'document',
            status: 'queued',
            mediaUrl: documentUrl,
            leadId: options?.leadId
                ? typeof options.leadId === 'string'
                    ? new mongoose_2.Types.ObjectId(options.leadId)
                    : options.leadId
                : undefined,
            triggerAction: options?.triggerAction,
        });
        try {
            const result = await this.provider.sendDocument(phoneNumber, documentUrl, caption);
            record.providerMessageId = result.providerMessageId;
            record.status = 'sent';
            record.sentAt = new Date();
            return record.save();
        }
        catch (err) {
            record.status = 'failed';
            record.errorInfo = { message: err.message, timestamp: new Date().toISOString() };
            await record.save();
            throw err;
        }
    }
    async sendImage(phoneNumber, imageUrl, caption, options) {
        const record = await this.messageModel.create({
            phoneNumber,
            message: caption || imageUrl,
            type: 'image',
            status: 'queued',
            mediaUrl: imageUrl,
            leadId: options?.leadId
                ? typeof options.leadId === 'string'
                    ? new mongoose_2.Types.ObjectId(options.leadId)
                    : options.leadId
                : undefined,
            triggerAction: options?.triggerAction,
        });
        try {
            const result = await this.provider.sendImage(phoneNumber, imageUrl, caption);
            record.providerMessageId = result.providerMessageId;
            record.status = 'sent';
            record.sentAt = new Date();
            return record.save();
        }
        catch (err) {
            record.status = 'failed';
            record.errorInfo = { message: err.message, timestamp: new Date().toISOString() };
            await record.save();
            throw err;
        }
    }
    async sendFollowupWithAttachments(phoneNumber, message, options) {
        const textMessage = await this.sendTextMessage(phoneNumber, message, options);
        const attachments = [];
        if (this.resumeUrl) {
            try {
                const doc = await this.sendDocument(phoneNumber, this.resumeUrl, 'Resume', options);
                attachments.push(doc);
            }
            catch (err) {
                this.logger.error({ err: err.message }, 'Resume send failed');
            }
        }
        if (this.architectureImageUrl) {
            try {
                const img = await this.sendImage(phoneNumber, this.architectureImageUrl, 'Architecture', options);
                attachments.push(img);
            }
            catch (err) {
                this.logger.error({ err: err.message }, 'Architecture image send failed');
            }
        }
        return { textMessage, attachments };
    }
    async getMessages(query) {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.status)
            filter.status = query.status;
        if (query.phoneNumber)
            filter.phoneNumber = query.phoneNumber;
        const [messages, total] = await Promise.all([
            this.messageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.messageModel.countDocuments(filter).exec(),
        ]);
        return { messages, total, page, limit };
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(whatsapp_message_schema_1.WhatsAppMessage.name)),
    __param(1, (0, common_2.Inject)(whatsapp_provider_interface_1.WHATSAPP_PROVIDER)),
    __metadata("design:paramtypes", [mongoose_2.Model, Object, config_1.ConfigService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map