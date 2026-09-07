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
exports.WebhookEventSchema = exports.WebhookEvent = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let WebhookEvent = class WebhookEvent {
};
exports.WebhookEvent = WebhookEvent;
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['vapi', 'whatsapp', 'sarvam', 'internal'] }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String, index: true, unique: true }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "providerEventId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "eventType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['received', 'processed', 'duplicate', 'failed', 'ignored'], default: 'received' }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], WebhookEvent.prototype, "rawPayload", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Call', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], WebhookEvent.prototype, "callId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], WebhookEvent.prototype, "errorMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], WebhookEvent.prototype, "processingTimeMs", void 0);
exports.WebhookEvent = WebhookEvent = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'webhook_events' })
], WebhookEvent);
exports.WebhookEventSchema = mongoose_1.SchemaFactory.createForClass(WebhookEvent);
exports.WebhookEventSchema.index({ provider: 1, createdAt: -1 });
//# sourceMappingURL=webhook-event.schema.js.map