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
exports.ConversationMessageSchema = exports.ConversationMessage = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ConversationMessage = class ConversationMessage {
};
exports.ConversationMessage = ConversationMessage;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Call', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ConversationMessage.prototype, "callId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['assistant', 'user', 'system', 'tool'] }),
    __metadata("design:type", String)
], ConversationMessage.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ConversationMessage.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'unknown' }),
    __metadata("design:type", String)
], ConversationMessage.prototype, "language", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], ConversationMessage.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true, sparse: true }),
    __metadata("design:type", String)
], ConversationMessage.prototype, "providerEventId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], ConversationMessage.prototype, "metadata", void 0);
exports.ConversationMessage = ConversationMessage = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'conversation_messages' })
], ConversationMessage);
exports.ConversationMessageSchema = mongoose_1.SchemaFactory.createForClass(ConversationMessage);
exports.ConversationMessageSchema.index({ callId: 1, timestamp: 1 });
//# sourceMappingURL=conversation-message.schema.js.map