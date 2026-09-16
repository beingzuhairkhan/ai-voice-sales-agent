import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
  context?: string;
}

@Injectable()
export class RetryUtil {
  private readonly logger = new Logger(RetryUtil.name);
  private readonly defaultMaxRetries: number;
  private readonly defaultBaseDelay: number;

  constructor(private config: ConfigService) {
    this.defaultMaxRetries = this.config.get<number>('MAX_RETRIES', 3);
    this.defaultBaseDelay = this.config.get<number>('RETRY_BASE_DELAY_MS', 500);
  }

  async withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}, context = 'external'): Promise<T> {
    const maxRetries = options.maxRetries ?? this.defaultMaxRetries;
    const baseDelay = options.baseDelayMs ?? this.defaultBaseDelay;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
          this.logger.warn(
            { err: (error as Error).message, attempt, nextRetryMs: Math.round(delay), context },
            `${context} call failed, retrying`,
          );
          await this.sleep(delay);
        }
      }
    }
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
