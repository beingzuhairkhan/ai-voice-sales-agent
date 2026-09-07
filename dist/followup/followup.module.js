"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const call_schema_1 = require("../calls/call.schema");
const lead_schema_1 = require("../leads/lead.schema");
const action_event_schema_1 = require("../common/types/action-event.schema");
const followup_orchestrator_service_1 = require("./followup-orchestrator.service");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
const ai_module_1 = require("../ai/ai.module");
const conversations_module_1 = require("../conversations/conversations.module");
let FollowupModule = class FollowupModule {
};
exports.FollowupModule = FollowupModule;
exports.FollowupModule = FollowupModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: call_schema_1.Call.name, schema: call_schema_1.CallSchema },
                { name: lead_schema_1.Lead.name, schema: lead_schema_1.LeadSchema },
                { name: action_event_schema_1.ActionEvent.name, schema: action_event_schema_1.ActionEventSchema },
            ]),
            whatsapp_module_1.WhatsAppModule,
            ai_module_1.AiModule,
            conversations_module_1.ConversationsModule,
        ],
        providers: [followup_orchestrator_service_1.FollowupOrchestratorService],
        exports: [followup_orchestrator_service_1.FollowupOrchestratorService],
    })
], FollowupModule);
//# sourceMappingURL=followup.module.js.map