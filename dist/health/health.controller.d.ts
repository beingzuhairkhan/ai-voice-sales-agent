import { HealthService } from './health.service';
export declare class HealthController {
    private healthService;
    constructor(healthService: HealthService);
    checkHealth(): Promise<{
        status: "healthy" | "degraded" | "unhealthy";
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
}
