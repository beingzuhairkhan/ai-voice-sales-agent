import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, tap } from 'rxjs';
import { Logger } from 'nestjs-pino';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    request.headers['x-request-id'] = requestId;
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const elapsed = Date.now() - startTime;
          this.logger.log(
            { requestId, method, url, statusCode: response.statusCode, elapsedMs: elapsed },
            'HTTP request',
          );
        },
      }),
    );
  }
}
