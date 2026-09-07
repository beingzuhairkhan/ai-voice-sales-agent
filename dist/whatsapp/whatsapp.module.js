"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const whatsapp_message_schema_1 = require("./whatsapp-message.schema");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_meta_provider_1 = require("./whatsapp-meta-provider");
const whatsapp_provider_interface_1 = require("./whatsapp-provider.interface");
const whatsapp_controller_1 = require("./whatsapp.controller");
let WhatsAppModule = class WhatsAppModule {
};
exports.WhatsAppModule = WhatsAppModule;
exports.WhatsAppModule = WhatsAppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: whatsapp_message_schema_1.WhatsAppMessage.name, schema: whatsapp_message_schema_1.WhatsAppMessageSchema },
            ]),
        ],
        controllers: [whatsapp_controller_1.WhatsAppController],
        providers: [
            whatsapp_service_1.WhatsAppService,
            { provide: whatsapp_provider_interface_1.WHATSAPP_PROVIDER, useClass: whatsapp_meta_provider_1.WhatsAppMetaProvider },
        ],
        exports: [whatsapp_service_1.WhatsAppService, mongoose_1.MongooseModule],
    })
], WhatsAppModule);
//# sourceMappingURL=whatsapp.module.js.map