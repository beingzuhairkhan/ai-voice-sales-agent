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
var FilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FilesService = FilesService_1 = class FilesService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(FilesService_1.name);
    }
    getFileConfig() {
        return {
            resumeUrl: this.config.get('RESUME_URL', ''),
            architectureImageUrl: this.config.get('ARCHITECTURE_IMAGE_URL', ''),
            developerName: this.config.get('DEVELOPER_NAME', ''),
            developerMobileNumber: this.config.get('DEVELOPER_MOBILE_NUMBER', ''),
        };
    }
    validateFileUrls() {
        const config = this.getFileConfig();
        return {
            resumeValid: Boolean(config.resumeUrl),
            architectureValid: Boolean(config.architectureImageUrl),
        };
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FilesService);
//# sourceMappingURL=files.service.js.map