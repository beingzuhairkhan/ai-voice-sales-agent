"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const callback_schema_1 = require("./callback.schema");
const callback_service_1 = require("./callback.service");
const callback_parser_service_1 = require("./callback-parser.service");
const ai_module_1 = require("../ai/ai.module");
const calendar_module_1 = require("../calendar/calendar.module");
let CallbackModule = class CallbackModule {
};
exports.CallbackModule = CallbackModule;
exports.CallbackModule = CallbackModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: callback_schema_1.Callback.name, schema: callback_schema_1.CallbackSchema }]),
            ai_module_1.AiModule,
            calendar_module_1.CalendarModule,
        ],
        providers: [callback_service_1.CallbackService, callback_parser_service_1.CallbackParserService],
        exports: [callback_service_1.CallbackService, callback_parser_service_1.CallbackParserService, mongoose_1.MongooseModule],
    })
], CallbackModule);
//# sourceMappingURL=callback.module.js.map