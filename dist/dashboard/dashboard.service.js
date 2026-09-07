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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const call_schema_1 = require("../calls/call.schema");
const lead_schema_1 = require("../leads/lead.schema");
const callback_schema_1 = require("../callback/callback.schema");
const whatsapp_message_schema_1 = require("../whatsapp/whatsapp-message.schema");
const action_event_schema_1 = require("../common/types/action-event.schema");
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(callModel, leadModel, callbackModel, whatsappModel, actionEventModel) {
        this.callModel = callModel;
        this.leadModel = leadModel;
        this.callbackModel = callbackModel;
        this.whatsappModel = whatsappModel;
        this.actionEventModel = actionEventModel;
        this.logger = new common_1.Logger(DashboardService_1.name);
    }
    async getOverview() {
        const [totalCalls, completedCalls, failedCalls, inProgressCalls, hotLeads, warmLeads, coldLeads, totalCallbacks, scheduledCallbacks, totalWhatsappMessages, sentWhatsappMessages, failedWhatsappMessages, recentActivity,] = await Promise.all([
            this.callModel.countDocuments().exec(),
            this.callModel.countDocuments({ status: 'ended' }).exec(),
            this.callModel.countDocuments({ status: { $in: ['failed', 'no-answer', 'busy', 'cancelled'] } }).exec(),
            this.callModel.countDocuments({ status: { $in: ['initiated', 'ringing', 'in-progress'] } }).exec(),
            this.leadModel.countDocuments({ temperature: 'HOT' }).exec(),
            this.leadModel.countDocuments({ temperature: 'WARM' }).exec(),
            this.leadModel.countDocuments({ temperature: 'COLD' }).exec(),
            this.callbackModel.countDocuments().exec(),
            this.callbackModel.countDocuments({ status: 'scheduled' }).exec(),
            this.whatsappModel.countDocuments().exec(),
            this.whatsappModel.countDocuments({ status: 'sent' }).exec(),
            this.whatsappModel.countDocuments({ status: 'failed' }).exec(),
            this.actionEventModel.find().sort({ createdAt: -1 }).limit(20).exec(),
        ]);
        return {
            totalCalls,
            completedCalls,
            failedCalls,
            inProgressCalls,
            hotLeads,
            warmLeads,
            coldLeads,
            totalCallbacks,
            scheduledCallbacks,
            totalWhatsappMessages,
            sentWhatsappMessages,
            failedWhatsappMessages,
            recentActivity,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(call_schema_1.Call.name)),
    __param(1, (0, mongoose_1.InjectModel)(lead_schema_1.Lead.name)),
    __param(2, (0, mongoose_1.InjectModel)(callback_schema_1.Callback.name)),
    __param(3, (0, mongoose_1.InjectModel)(whatsapp_message_schema_1.WhatsAppMessage.name)),
    __param(4, (0, mongoose_1.InjectModel)(action_event_schema_1.ActionEvent.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map