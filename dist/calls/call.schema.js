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
exports.CallSchema = exports.Call = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Call = class Call {
};
exports.Call = Call;
__decorate([
    (0, mongoose_1.Prop)({ index: true, unique: true, sparse: true }),
    __metadata("design:type", String)
], Call.prototype, "vapiCallId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Call.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['initiated', 'ringing', 'in-progress', 'ended', 'failed', 'no-answer', 'busy', 'cancelled', 'queued'], default: 'initiated' }),
    __metadata("design:type", String)
], Call.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Call.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Call.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], Call.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'unknown' }),
    __metadata("design:type", String)
], Call.prototype, "language", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Call.prototype, "transcript", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Call.prototype, "summary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Call.prototype, "recordingUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Lead', index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Call.prototype, "leadId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Call.prototype, "metadata", void 0);
exports.Call = Call = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'calls' })
], Call);
exports.CallSchema = mongoose_1.SchemaFactory.createForClass(Call);
exports.CallSchema.index({ phoneNumber: 1, createdAt: -1 });
//# sourceMappingURL=call.schema.js.map