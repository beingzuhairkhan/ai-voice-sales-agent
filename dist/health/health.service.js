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
        const providers = this.checkProviderConfig();
        const databaseHealthy = mongoHealth.status === 'up' &&
            redisHealth.status === 'up';
        const status = databaseHealthy ? 'healthy' : 'degraded';
        return {
            status,
            services: {
                mongodb: mongoHealth,
                redis: redisHealth,
                providers,
            },
            timestamp: new Date().toISOString(),
        };
    }
    async checkMongo() {
        const start = Date.now();
        try {
            const connection = this.healthModel.db;
            if (connection.readyState !== 1) {
                this.logger.warn(`MongoDB connection is not ready. readyState=${connection.readyState}`);
                return {
                    status: 'down',
                };
            }
            if (!connection.db) {
                this.logger.warn('MongoDB database instance is unavailable');
                return {
                    status: 'down',
                };
            }
            await connection.db.command({ ping: 1 });
            return {
                status: 'up',
                latencyMs: Date.now() - start,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`MongoDB health check failed: ${message}`);
            return {
                status: 'down',
            };
        }
    }
    async checkRedis() {
        const start = Date.now();
        const redisUrl = this.config.get('REDIS_URL', 'redis://localhost:6379');
        const redis = new ioredis_1.Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            connectTimeout: 3000,
            lazyConnect: true,
            retryStrategy: () => null,
        });
        try {
            await redis.connect();
            const pong = await redis.ping();
            if (pong !== 'PONG') {
                return {
                    status: 'down',
                };
            }
            return {
                status: 'up',
                latencyMs: Date.now() - start,
            };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Redis health check failed: ${message}`);
            return {
                status: 'down',
            };
        }
        finally {
            redis.disconnect();
        }
    }
    checkProviderConfig() {
        return {
            vapi: this.hasConfig('VAPI_API_KEY'),
            sarvam: this.hasConfig('SARVAM_API_KEY'),
            openai: this.hasConfig('OPENAI_API_KEY'),
            whatsapp: this.hasConfig('WHATSAPP_ACCESS_TOKEN'),
            googleCalendar: this.hasConfig('GOOGLE_CLIENT_ID') &&
                this.hasConfig('GOOGLE_REFRESH_TOKEN'),
        };
    }
    hasConfig(key) {
        const value = this.config.get(key);
        return Boolean(value && value.trim().length > 0);
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