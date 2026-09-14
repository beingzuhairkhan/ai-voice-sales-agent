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
exports.CallbackSchema = exports.Callback = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Callback = class Callback {
};
exports.Callback = Callback;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Lead', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Callback.prototype, "leadId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Call', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Callback.prototype, "callId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Call', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Callback.prototype, "callbackCallId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Callback.prototype, "requestedTimePhrase", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, index: true }),
    __metadata("design:type", Date)
], Callback.prototype, "parsedDateTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: 'Asia/Kolkata' }),
    __metadata("design:type", String)
], Callback.prototype, "timezone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0, min: 0, max: 1 }),
    __metadata("design:type", Number)
], Callback.prototype, "confidence", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['requested', 'confirmed', 'scheduled', 'completed', 'cancelled', 'failed'], default: 'requested' }),
    __metadata("design:type", String)
], Callback.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Callback.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Callback.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, index: true, sparse: true }),
    __metadata("design:type", String)
], Callback.prototype, "googleCalendarEventId", void 0);
exports.Callback = Callback = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'callbacks' })
], Callback);
exports.CallbackSchema = mongoose_1.SchemaFactory.createForClass(Callback);
//# sourceMappingURL=callback.schema.js.map