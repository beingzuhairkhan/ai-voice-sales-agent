import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Redis } from 'ioredis';
import { HealthCheck } from './health-check.schema';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private config: ConfigService,
    @InjectModel(HealthCheck.name) private healthModel: Model<HealthCheck>,
  ) {}

  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      mongodb: { status: string; latencyMs?: number };
      redis: { status: string; latencyMs?: number };
      providers: {
        vapi: boolean;
        sarvam: boolean;
        openai: boolean;
        whatsapp: boolean;
        googleCalendar: boolean;
      };
    };
    timestamp: string;
  }> {
    const [mongoHealth, redisHealth] = await Promise.all([
      this.checkMongo(),
      this.checkRedis(),
    ]);

    const providerConfig = this.checkProviderConfig();

    const allHealthy =
      mongoHealth.status === 'up' &&
      redisHealth.status === 'up';
    const status: 'healthy' | 'degraded' | 'unhealthy' = allHealthy ? 'healthy' : 'degraded';

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

  private async checkMongo(): Promise<{ status: string; latencyMs?: number }> {
    try {
      const start = Date.now();
      // Use the injected model's collection to ping
      const res = await (this.healthModel.db as any).admin().ping();
      const latency = Date.now() - start;
      return { status: res.ok === 1 ? 'up' : 'down', latencyMs: latency };
    } catch (err) {
      this.logger.warn({ err: (err as Error).message }, 'MongoDB health check failed');
      return { status: 'down' };
    }
  }

  private async checkRedis(): Promise<{ status: string; latencyMs?: number }> {
    try {
      const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
      const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, retryStrategy: () => null });
      const start = Date.now();
      const pong = await redis.ping();
      const latency = Date.now() - start;
      redis.disconnect();
      return { status: pong === 'PONG' ? 'up' : 'down', latencyMs: latency };
    } catch (err) {
      this.logger.warn({ err: (err as Error).message }, 'Redis health check failed');
      return { status: 'down' };
    }
  }

  private checkProviderConfig(): {
    vapi: boolean;
    sarvam: boolean;
    openai: boolean;
    whatsapp: boolean;
    googleCalendar: boolean;
  } {
    return {
      vapi: Boolean(this.config.get<string>('VAPI_API_KEY')),
      sarvam: Boolean(this.config.get<string>('SARVAM_API_KEY')),
      openai: Boolean(this.config.get<string>('OPENAI_API_KEY')),
      whatsapp: Boolean(this.config.get<string>('WHATSAPP_ACCESS_TOKEN')),
      googleCalendar: Boolean(
        this.config.get<string>('GOOGLE_CLIENT_ID') &&
        this.config.get<string>('GOOGLE_REFRESH_TOKEN'),
      ),
    };
  }
}
