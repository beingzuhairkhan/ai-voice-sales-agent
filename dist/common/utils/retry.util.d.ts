import { ConfigService } from '@nestjs/config';
export interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    timeoutMs?: number;
    context?: string;
}
export declare class RetryUtil {
    private config;
    private readonly logger;
    private readonly defaultMaxRetries;
    private readonly defaultBaseDelay;
    constructor(config: ConfigService);
    withRetry<T>(fn: () => Promise<T>, options?: RetryOptions, context?: string): Promise<T>;
    private sleep;
}
