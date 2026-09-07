import { LlmProvider } from '../ai/llm-provider.interface';
import { DateUtil } from '../common/utils/date.util';
export interface CallbackParseResult {
    parsedDateTime: Date | null;
    confidence: number;
    timezone: string;
    clarificationNeeded: boolean;
    rawAiResult?: Record<string, any>;
}
export declare class CallbackParserService {
    private llmProvider;
    private dateUtil;
    private readonly logger;
    constructor(llmProvider: LlmProvider, dateUtil: DateUtil);
    parseCallbackRequest(naturalPhrase: string, referenceDate?: Date): Promise<CallbackParseResult>;
}
