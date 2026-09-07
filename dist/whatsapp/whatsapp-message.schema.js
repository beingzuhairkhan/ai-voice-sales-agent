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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppMessageSchema = exports.WhatsAppMessage = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let WhatsAppMessage = class WhatsAppMessage {
};
exports.WhatsAppMessage = WhatsAppMessage;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Lead', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WhatsAppMessage.prototype, "leadId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], WhatsAppMessage.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WhatsAppMessage.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['text', 'document', 'image', 'template'], default: 'text' }),
    __metadata("design:type", String)
], WhatsAppMessage.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'pending'], default: 'queued', index: true }),
    __metadata("design:type", String)
], WhatsAppMessage.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true, sparse: true }),
    __metadata("design:type", String)
], WhatsAppMessage.prototype, "providerMessageId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], WhatsAppMessage.prototype, "sentAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], WhatsAppMessage.prototype, "deliveredAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], WhatsAppMessage.prototype, "deliveryInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], WhatsAppMessage.prototype, "errorInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], WhatsAppMessage.prototype, "mediaUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], WhatsAppMessage.prototype, "mediaId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], WhatsAppMessage.prototype, "triggerAction", void 0);
exports.WhatsAppMessage = WhatsAppMessage = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'whatsapp_messages' })
], WhatsAppMessage);
exports.WhatsAppMessageSchema = mongoose_1.SchemaFactory.createForClass(WhatsAppMessage);
exports.WhatsAppMessageSchema.index({ status: 1, createdAt: -1 });
//# sourceMappingURL=whatsapp-message.schema.js.map