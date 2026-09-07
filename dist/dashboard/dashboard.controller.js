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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
const leads_service_1 = require("../leads/leads.service");
const callback_service_1 = require("../callback/callback.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const class_validator_1 = require("class-validator");
class DashboardLeadQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DashboardLeadQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DashboardLeadQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DashboardLeadQueryDto.prototype, "temperature", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DashboardLeadQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DashboardLeadQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DashboardLeadQueryDto.prototype, "endDate", void 0);
let DashboardController = class DashboardController {
    constructor(dashboardService, leadsService, callbackService, whatsappService) {
        this.dashboardService = dashboardService;
        this.leadsService = leadsService;
        this.callbackService = callbackService;
        this.whatsappService = whatsappService;
    }
    async getOverview() {
        return this.dashboardService.getOverview();
    }
    async getLeads(query) {
        return this.leadsService.getLeads(query);
    }
    async getLead(id) {
        return this.leadsService.getLeadById(id);
    }
    async getCallbacks(page, limit, status) {
        return this.callbackService.getCallbacks({ page, limit, status });
    }
    async getWhatsappMessages(page, limit, status, phoneNumber) {
        return this.whatsappService.getMessages({ page, limit, status, phoneNumber });
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('dashboard/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Dashboard overview — counts and recent activity' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('leads'),
    (0, swagger_1.ApiOperation)({ summary: 'List leads with pagination, search, temperature and date filters' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DashboardLeadQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getLeads", null);
__decorate([
    (0, common_1.Get)('leads/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single lead by ID' }),
    __param(0, (0, common_1.Query)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getLead", null);
__decorate([
    (0, common_1.Get)('callbacks'),
    (0, swagger_1.ApiOperation)({ summary: 'List callbacks with pagination and status filter' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getCallbacks", null);
__decorate([
    (0, common_1.Get)('whatsapp/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'List WhatsApp messages with pagination and filters' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('phoneNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getWhatsappMessages", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        leads_service_1.LeadsService,
        callback_service_1.CallbackService,
        whatsapp_service_1.WhatsAppService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map