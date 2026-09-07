import { ConfigService } from '@nestjs/config';
export declare class DateUtil {
    private config;
    constructor(config: ConfigService);
    resolveRelativeTime(naturalPhrase: string, parsedDateTime: string | null, referenceDate?: Date): {
        dateTime: Date;
        confidence: number;
    } | null;
    private nextWeekday;
    private logger_log;
}
