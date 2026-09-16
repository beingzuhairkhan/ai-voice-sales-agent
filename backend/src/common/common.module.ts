import { Global, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { RequestContext } from './types/request-context';
import { RetryUtil } from './utils/retry.util';
import { DateUtil } from './utils/date.util';
import { IdempotencyUtil } from './utils/idempotency.util';

@Global()
@Module({
  providers: [
    LoggingInterceptor,
    TimeoutInterceptor,
    RetryUtil,
    DateUtil,
    IdempotencyUtil,
    {
      provide: REQUEST,
      scope: Scope.REQUEST,
      useFactory: () => ({} as RequestContext),
    },
  ],
  exports: [LoggingInterceptor, TimeoutInterceptor, RetryUtil, DateUtil, IdempotencyUtil],
})
export class CommonModule {}
