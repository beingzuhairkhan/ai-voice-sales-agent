import { ConfigService } from '@nestjs/config';
import { RetryUtil } from '../common/utils/retry.util';
import { ChatMessage, LlmProvider, StructuredExtractionParams } from './llm-provider.interface';
export declare class OpenAiProvider implements LlmProvider {
    private config;
    private retryUtil;
    private readonly logger;
    private readonly sarvamApiKey;
    private readonly sarvamModel;
    private readonly sarvamBaseUrl;
    private readonly fallbackProvider?;
    private readonly groqApiKey?;
    private readonly groqModel?;
    constructor(config: ConfigService, retryUtil: RetryUtil);
    structuredExtraction(params: StructuredExtractionParams): Promise<Record<string, any>>;
    chatCompletion(messages: ChatMessage[], options?: {
        model?: string;
        temperature?: number;
    }): Promise<string>;
    summarize(transcript: string, systemPrompt: string): Promise<string>;
    private sarvamStructuredCall;
    private sarvamChat;
    private groqStructuredCall;
    private groqChat;
}
