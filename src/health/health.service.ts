import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Redis } from 'ioredis';
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

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(HealthCheck.name)
    private readonly healthModel: Model<HealthCheck>,
    private readonly redis: Redis,
  ) {}

  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      mongodb: ServiceStatus;
      redis: ServiceStatus;
      providers: ProviderStatus;
    };
    timestamp: string;
  }> {
    const [mongoHealth, redisHealth] = await Promise.all([
      this.checkMongo(),
      this.checkRedis(),
    ]);

    const providers = this.checkProviderConfig();

    const databaseHealthy =
      mongoHealth.status === 'up' &&
      redisHealth.status === 'up';

    const status: 'healthy' | 'degraded' | 'unhealthy' =
      databaseHealthy ? 'healthy' : 'degraded';

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

  private async checkMongo(): Promise<ServiceStatus> {
    const start = Date.now();

    try {
      const connection = this.healthModel.db;

      if (connection.readyState !== 1) {
        this.logger.warn(
          `MongoDB is not connected. Mongoose readyState=${connection.readyState}`,
        );

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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);

      this.logger.error(
        `MongoDB health check failed: ${message}`,
      );

      return {
        status: 'down',
      };
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    const start = Date.now();

    try {
      const pong = await this.redis.ping();

      if (pong !== 'PONG') {
        this.logger.warn(
          `Redis returned unexpected response: ${pong}`,
        );

        return {
          status: 'down',
        };
      }

      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);

      this.logger.error(
        `Redis health check failed: ${message}`,
      );

      return {
        status: 'down',
      };
    }
  }

  private checkProviderConfig(): ProviderStatus {
    return {
      vapi: this.hasConfig('VAPI_API_KEY'),
      sarvam: this.hasConfig('SARVAM_API_KEY'),
      openai: this.hasConfig('OPENAI_API_KEY'),
      whatsapp: this.hasConfig('WHATSAPP_ACCESS_TOKEN'),
      googleCalendar:
        this.hasConfig('GOOGLE_CLIENT_ID') &&
        this.hasConfig('GOOGLE_REFRESH_TOKEN'),
    };
  }

  private hasConfig(key: string): boolean {
    const value = this.config.get<string>(key);

    return Boolean(value && value.trim().length > 0);
  }
}
