"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const webhook_event_schema_1 = require("./webhook-event.schema");
const action_event_schema_1 = require("../common/types/action-event.schema");
const webhooks_controller_1 = require("./webhooks.controller");
const webhooks_service_1 = require("./webhooks.service");
const calls_module_1 = require("../calls/calls.module");
const conversations_module_1 = require("../conversations/conversations.module");
const leads_module_1 = require("../leads/leads.module");
const ai_module_1 = require("../ai/ai.module");
const qualification_module_1 = require("../qualification/qualification.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
let WebhooksModule = class WebhooksModule {
};
exports.WebhooksModule = WebhooksModule;
exports.WebhooksModule = WebhooksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: webhook_event_schema_1.WebhookEvent.name, schema: webhook_event_schema_1.WebhookEventSchema },
                { name: action_event_schema_1.ActionEvent.name, schema: action_event_schema_1.ActionEventSchema },
            ]),
            calls_module_1.CallsModule,
            conversations_module_1.ConversationsModule,
            leads_module_1.LeadsModule,
            ai_module_1.AiModule,
            qualification_module_1.QualificationModule,
            whatsapp_module_1.WhatsAppModule,
        ],
        controllers: [webhooks_controller_1.WebhooksController],
        providers: [webhooks_service_1.WebhooksService],
        exports: [webhooks_service_1.WebhooksService],
    })
], WebhooksModule);
//# sourceMappingURL=webhooks.module.js.map