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
var HealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ioredis_1 = require("ioredis");
const health_check_schema_1 = require("./health-check.schema");
let HealthService = HealthService_1 = class HealthService {
    constructor(config, healthModel) {
        this.config = config;
        this.healthModel = healthModel;
        this.logger = new common_1.Logger(HealthService_1.name);
    }
    async checkHealth() {
        const [mongoHealth, redisHealth] = await Promise.all([
            this.checkMongo(),
            this.checkRedis(),
        ]);
        const providerConfig = this.checkProviderConfig();
        const allHealthy = mongoHealth.status === 'up' &&
            redisHealth.status === 'up';
        const status = allHealthy ? 'healthy' : 'degraded';
        return {
            status,
            services: {
                mongodb: mongoHealth,
                redis: redisHealth,
                providers: providerConfig,
            },
            timestamp: new Date().toISOString(),
        };
    }
    async checkMongo() {
        try {
            const start = Date.now();
            const res = await this.healthModel.db.admin().ping();
            const latency = Date.now() - start;
            return { status: res.ok === 1 ? 'up' : 'down', latencyMs: latency };
        }
        catch (err) {
            this.logger.warn({ err: err.message }, 'MongoDB health check failed');
            return { status: 'down' };
        }
    }
    async checkRedis() {
        try {
            const redisUrl = this.config.get('REDIS_URL', 'redis://localhost:6379');
            const redis = new ioredis_1.Redis(redisUrl, { maxRetriesPerRequest: 1, retryStrategy: () => null });
            const start = Date.now();
            const pong = await redis.ping();
            const latency = Date.now() - start;
            redis.disconnect();
            return { status: pong === 'PONG' ? 'up' : 'down', latencyMs: latency };
        }
        catch (err) {
            this.logger.warn({ err: err.message }, 'Redis health check failed');
            return { status: 'down' };
        }
    }
    checkProviderConfig() {
        return {
            vapi: Boolean(this.config.get('VAPI_API_KEY')),
            sarvam: Boolean(this.config.get('SARVAM_API_KEY')),
            openai: Boolean(this.config.get('OPENAI_API_KEY')),
            whatsapp: Boolean(this.config.get('WHATSAPP_ACCESS_TOKEN')),
            googleCalendar: Boolean(this.config.get('GOOGLE_CLIENT_ID') &&
                this.config.get('GOOGLE_REFRESH_TOKEN')),
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = HealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(health_check_schema_1.HealthCheck.name)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model])
], HealthService);
//# sourceMappingURL=health.service.js.map