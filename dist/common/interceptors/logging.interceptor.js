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
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const rxjs_1 = require("rxjs");
const nestjs_pino_1 = require("nestjs-pino");
let LoggingInterceptor = class LoggingInterceptor {
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const requestId = request.headers['x-request-id'] || (0, crypto_1.randomUUID)();
        request.headers['x-request-id'] = requestId;
        const { method, url } = request;
        const startTime = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                const response = context.switchToHttp().getResponse();
                const elapsed = Date.now() - startTime;
                this.logger.log({ requestId, method, url, statusCode: response.statusCode, elapsedMs: elapsed }, 'HTTP request');
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_pino_1.Logger])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map