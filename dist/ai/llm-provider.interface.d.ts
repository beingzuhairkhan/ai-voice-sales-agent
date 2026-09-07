export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface StructuredExtractionParams {
    messages: ChatMessage[];
    schema: Record<string, any>;
    model?: string;
    temperature?: number;
}
export interface LlmProvider {
    structuredExtraction(params: StructuredExtractionParams): Promise<Record<string, any>>;
    chatCompletion(messages: ChatMessage[], options?: {
        model?: string;
        temperature?: number;
    }): Promise<string>;
    summarize(transcript: string, systemPrompt: string): Promise<string>;
}
export declare const LLM_PROVIDER = "LLM_PROVIDER";
