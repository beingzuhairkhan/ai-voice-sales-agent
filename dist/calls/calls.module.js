"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const call_schema_1 = require("./call.schema");
const action_event_schema_1 = require("../common/types/action-event.schema");
const calls_controller_1 = require("./calls.controller");
const calls_service_1 = require("./calls.service");
const vapi_module_1 = require("../vapi/vapi.module");
const leads_module_1 = require("../leads/leads.module");
let CallsModule = class CallsModule {
};
exports.CallsModule = CallsModule;
exports.CallsModule = CallsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: call_schema_1.Call.name, schema: call_schema_1.CallSchema },
                { name: action_event_schema_1.ActionEvent.name, schema: action_event_schema_1.ActionEventSchema },
            ]),
            vapi_module_1.VapiModule,
            leads_module_1.LeadsModule,
        ],
        controllers: [calls_controller_1.CallsController],
        providers: [calls_service_1.CallsService],
        exports: [calls_service_1.CallsService, mongoose_1.MongooseModule],
    })
], CallsModule);
//# sourceMappingURL=calls.module.js.map