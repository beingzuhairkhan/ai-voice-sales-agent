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
exports.ActionEventSchema = exports.ActionEvent = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ActionEvent = class ActionEvent {
};
exports.ActionEvent = ActionEvent;
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: [
            'CALL_STARTED', 'CALL_ENDED', 'HOT_DETECTED', 'LEAD_CLASSIFIED',
            'WHATSAPP_TRIGGERED', 'WHATSAPP_SENT', 'WHATSAPP_FAILED',
            'CALLBACK_REQUESTED', 'CALLBACK_BOOKED', 'FOLLOWUP_GENERATED',
            'FOLLOWUP_SENT', 'LEAD_EXTRACTED', 'ERROR',
        ] }),
    __metadata("design:type", String)
], ActionEvent.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Call', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ActionEvent.prototype, "callId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Lead', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ActionEvent.prototype, "leadId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], ActionEvent.prototype, "data", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], ActionEvent.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], ActionEvent.prototype, "success", void 0);
exports.ActionEvent = ActionEvent = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'action_events' })
], ActionEvent);
exports.ActionEventSchema = mongoose_1.SchemaFactory.createForClass(ActionEvent);
exports.ActionEventSchema.index({ callId: 1, createdAt: 1 });
exports.ActionEventSchema.index({ type: 1, createdAt: -1 });
//# sourceMappingURL=action-event.schema.js.map