import { Inject , Injectable, Logger } from '@nestjs/common';
import { LlmProvider , LLM_PROVIDER } from '../ai/llm-provider.interface';
import { CALLBACK_PARSING_PROMPT } from '../ai/prompts/callback-parsing.prompt';
import { DateUtil } from '../common/utils/date.util';

export interface CallbackParseResult {
  parsedDateTime: Date | null;
  confidence: number;
  timezone: string;
  clarificationNeeded: boolean;
  rawAiResult?: Record<string, any>;
}

const CALLBACK_SCHEMA = {
  type: 'object',
  properties: {
    parsedDateTime: { type: ['string', 'null'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    timezone: { type: 'string' },
    clarificationNeeded: { type: 'boolean' },
  },
  required: ['parsedDateTime', 'confidence', 'timezone', 'clarificationNeeded'],
};

@Injectable()
export class CallbackParserService {
  private readonly logger = new Logger(CallbackParserService.name);

  constructor(
     @Inject(LLM_PROVIDER)
    private llmProvider: LlmProvider,
    private dateUtil: DateUtil,
  ) {}

  async parseCallbackRequest(
    naturalPhrase: string,
    referenceDate: Date = new Date(),
  ): Promise<CallbackParseResult> {
    if (!naturalPhrase || naturalPhrase.trim().length === 0) {
      return {
        parsedDateTime: null,
        confidence: 0,
        timezone: 'Asia/Kolkata',
        clarificationNeeded: true,
      };
    }

    let aiResult: Record<string, any>;
    try {
      aiResult = await this.llmProvider.structuredExtraction({
        messages: [
          { role: 'system', content: CALLBACK_PARSING_PROMPT },
          {
            role: 'user',
            content: `Time phrase: "${naturalPhrase}"\nCurrent date/time: ${referenceDate.toISOString()}`,
          },
        ],
        schema: CALLBACK_SCHEMA,
        temperature: 0.1,
      });
    } catch (err) {
      this.logger.error({ err: (err as Error).message }, 'AI callback parsing failed, using deterministic fallback');
      const fallback = this.dateUtil.resolveRelativeTime(naturalPhrase, null, referenceDate);
      return {
        parsedDateTime: fallback?.dateTime || null,
        confidence: fallback?.confidence || 0.3,
        timezone: 'Asia/Kolkata',
        clarificationNeeded: !fallback,
      };
    }

    const clarificationNeeded = Boolean(aiResult.clarificationNeeded);
    const aiDateTime = aiResult.parsedDateTime as string | null;
    const aiConfidence = Math.max(0, Math.min(1, Number(aiResult.confidence) || 0));

    // Cross-check with deterministic resolver
    const deterministic = this.dateUtil.resolveRelativeTime(naturalPhrase, aiDateTime, referenceDate);

    if (clarificationNeeded || !deterministic) {
      return {
        parsedDateTime: null,
        confidence: aiConfidence,
        timezone: 'Asia/Kolkata',
        clarificationNeeded: true,
        rawAiResult: aiResult,
      };
    }

    // Validate: parsed time must be in the future
    if (deterministic.dateTime <= referenceDate) {
      this.logger.warn({ parsed: deterministic.dateTime.toISOString() }, 'Parsed callback time is in the past, requesting clarification');
      return {
        parsedDateTime: null,
        confidence: 0.3,
        timezone: 'Asia/Kolkata',
        clarificationNeeded: true,
        rawAiResult: aiResult,
      };
    }

    return {
      parsedDateTime: deterministic.dateTime,
      confidence: Math.max(deterministic.confidence, aiConfidence),
      timezone: 'Asia/Kolkata',
      clarificationNeeded: false,
      rawAiResult: aiResult,
    };
  }
}
