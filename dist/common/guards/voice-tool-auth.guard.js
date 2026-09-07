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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceToolAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let VoiceToolAuthGuard = class VoiceToolAuthGuard {
    constructor(config) {
        this.config = config;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const expectedSecret = this.config.get('VAPI_WEBHOOK_SECRET');
        if (!expectedSecret) {
            return true;
        }
        const authorization = request.headers['authorization'];
        const expectedAuthorization = `Bearer ${expectedSecret}`;
        if (authorization !== expectedAuthorization) {
            request.log?.warn?.({
                hasAuthorization: !!authorization,
            }, 'Vapi tool authorization mismatch');
            throw new common_1.UnauthorizedException('Invalid authorization');
        }
        return true;
    }
};
exports.VoiceToolAuthGuard = VoiceToolAuthGuard;
exports.VoiceToolAuthGuard = VoiceToolAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VoiceToolAuthGuard);
//# sourceMappingURL=voice-tool-auth.guard.js.map