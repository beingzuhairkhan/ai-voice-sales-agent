import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private config: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const timeoutMs = this.config.get<number>('HTTP_TIMEOUT_MS', 15000);
    return next.handle().pipe(
      timeout(timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException('Request timeout exceeded'));
        }
        return throwError(() => err);
      }),
    );
  }
}
