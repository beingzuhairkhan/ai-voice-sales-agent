import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { HealthCheck } from './health-check.schema';
export declare class HealthService {
    private config;
    private healthModel;
    private readonly logger;
    constructor(config: ConfigService, healthModel: Model<HealthCheck>);
    checkHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: {
            mongodb: {
                status: string;
                latencyMs?: number;
            };
            redis: {
                status: string;
                latencyMs?: number;
            };
            providers: {
                vapi: boolean;
                sarvam: boolean;
                openai: boolean;
                whatsapp: boolean;
                googleCalendar: boolean;
            };
        };
        timestamp: string;
    }>;
    private checkMongo;
    private checkRedis;
    private checkProviderConfig;
}
