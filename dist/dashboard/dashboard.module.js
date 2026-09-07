"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const call_schema_1 = require("../calls/call.schema");
const lead_schema_1 = require("../leads/lead.schema");
const callback_schema_1 = require("../callback/callback.schema");
const whatsapp_message_schema_1 = require("../whatsapp/whatsapp-message.schema");
const action_event_schema_1 = require("../common/types/action-event.schema");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const leads_module_1 = require("../leads/leads.module");
const callback_module_1 = require("../callback/callback.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: call_schema_1.Call.name, schema: call_schema_1.CallSchema },
                { name: lead_schema_1.Lead.name, schema: lead_schema_1.LeadSchema },
                { name: callback_schema_1.Callback.name, schema: callback_schema_1.CallbackSchema },
                { name: whatsapp_message_schema_1.WhatsAppMessage.name, schema: whatsapp_message_schema_1.WhatsAppMessageSchema },
                { name: action_event_schema_1.ActionEvent.name, schema: action_event_schema_1.ActionEventSchema },
            ]),
            leads_module_1.LeadsModule,
            callback_module_1.CallbackModule,
            whatsapp_module_1.WhatsAppModule,
        ],
        controllers: [dashboard_controller_1.DashboardController],
        providers: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map