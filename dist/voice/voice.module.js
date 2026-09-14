"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const call_schema_1 = require("../calls/call.schema");
const lead_schema_1 = require("../leads/lead.schema");
const action_event_schema_1 = require("../common/types/action-event.schema");
const voice_tools_controller_1 = require("./voice-tools.controller");
const voice_tools_service_1 = require("./voice-tools.service");
const leads_module_1 = require("../leads/leads.module");
const conversations_module_1 = require("../conversations/conversations.module");
const ai_module_1 = require("../ai/ai.module");
const qualification_module_1 = require("../qualification/qualification.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
const callback_module_1 = require("../callback/callback.module");
const vapi_module_1 = require("../vapi/vapi.module");
const sarvam_module_1 = require("../sarvam/sarvam.module");
let VoiceModule = class VoiceModule {
};
exports.VoiceModule = VoiceModule;
exports.VoiceModule = VoiceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: call_schema_1.Call.name, schema: call_schema_1.CallSchema },
                { name: lead_schema_1.Lead.name, schema: lead_schema_1.LeadSchema },
                { name: action_event_schema_1.ActionEvent.name, schema: action_event_schema_1.ActionEventSchema },
            ]),
            leads_module_1.LeadsModule,
            conversations_module_1.ConversationsModule,
            ai_module_1.AiModule,
            qualification_module_1.QualificationModule,
            whatsapp_module_1.WhatsAppModule,
            callback_module_1.CallbackModule,
            vapi_module_1.VapiModule,
            sarvam_module_1.SarvamModule
        ],
        controllers: [voice_tools_controller_1.VoiceToolsController],
        providers: [voice_tools_service_1.VoiceToolsService],
    })
], VoiceModule);
//# sourceMappingURL=voice.module.js.map