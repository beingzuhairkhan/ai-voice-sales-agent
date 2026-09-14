import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { HealthCheck } from './health-check.schema';
type ServiceStatus = {
    status: 'up' | 'down';
    latencyMs?: number;
};
type ProviderStatus = {
    vapi: boolean;
    sarvam: boolean;
    openai: boolean;
    whatsapp: boolean;
    googleCalendar: boolean;
};
export declare class HealthService {
    private readonly config;
    private readonly healthModel;
    private readonly logger;
    constructor(config: ConfigService, healthModel: Model<HealthCheck>);
    checkHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: {
            mongodb: ServiceStatus;
            redis: ServiceStatus;
            providers: ProviderStatus;
        };
        timestamp: string;
    }>;
    private checkMongo;
    private checkRedis;
    private checkProviderConfig;
    private hasConfig;
}
export {};
