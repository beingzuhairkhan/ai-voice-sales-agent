import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
export declare class TimeoutInterceptor implements NestInterceptor {
    private config;
    constructor(config: ConfigService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
