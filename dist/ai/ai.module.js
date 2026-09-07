"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const openai_provider_1 = require("./openai-provider");
const lead_extraction_service_1 = require("./lead-extraction.service");
const followup_generation_service_1 = require("./followup-generation.service");
const agent_configuration_schema_1 = require("./agent-configuration.schema");
const llm_provider_interface_1 = require("./llm-provider.interface");
const conversations_module_1 = require("../conversations/conversations.module");
const ai_controller_1 = require("./ai.controller");
const qualification_module_1 = require("../qualification/qualification.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: agent_configuration_schema_1.AgentConfiguration.name, schema: agent_configuration_schema_1.AgentConfigurationSchema },
            ]),
            conversations_module_1.ConversationsModule,
            (0, common_1.forwardRef)(() => qualification_module_1.QualificationModule),
        ],
        providers: [
            { provide: llm_provider_interface_1.LLM_PROVIDER, useClass: openai_provider_1.OpenAiProvider },
            lead_extraction_service_1.LeadExtractionService,
            followup_generation_service_1.FollowupService,
        ],
        controllers: [ai_controller_1.AiController],
        exports: [
            llm_provider_interface_1.LLM_PROVIDER,
            lead_extraction_service_1.LeadExtractionService,
            followup_generation_service_1.FollowupService,
        ],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map