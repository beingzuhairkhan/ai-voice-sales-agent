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
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const isHttp = exception instanceof common_1.HttpException;
        const status = isHttp
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message;
        if (isHttp) {
            const resp = exception.getResponse();
            message = typeof resp === 'string' ? resp : resp.message || exception.message;
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        else {
            message = 'Internal server error';
        }
        const errorResponse = {
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
            requestId: request.headers['x-request-id'],
        };
        this.logger.error({ err: exception, statusCode: status, path: request.url }, 'Unhandled exception');
        response.status(status).json(errorResponse);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [nestjs_pino_1.Logger])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map