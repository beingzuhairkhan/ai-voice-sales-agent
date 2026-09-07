import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger;
    constructor(logger: Logger);
    catch(exception: unknown, host: ArgumentsHost): void;
}
