import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    if (isHttp) {
      const resp = (exception as HttpException).getResponse();
      message = typeof resp === 'string' ? resp : (resp as any).message || (exception as HttpException).message;
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      message = 'Internal server error';
    }

    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id'] as string,
    };

    this.logger.error(
      { err: exception, statusCode: status, path: request.url },
      'Unhandled exception',
    );

    response.status(status).json(errorResponse);
  }
}
