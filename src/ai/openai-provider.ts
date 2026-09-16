
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetryUtil } from '../common/utils/retry.util';
import {
  ChatMessage,
  LlmProvider,
  StructuredExtractionParams,
} from './llm-provider.interface';

@Injectable()
export class OpenAiProvider implements LlmProvider {
  private readonly logger = new Logger(OpenAiProvider.name);

  // Sarvam
  private readonly sarvamApiKey: string;
  private readonly sarvamModel: string;
  private readonly sarvamBaseUrl =
    'https://api.sarvam.ai/v1';

  // Groq fallback
  private readonly fallbackProvider?: string;
  private readonly groqApiKey?: string;
  private readonly groqModel?: string;

  constructor(
    private config: ConfigService,
    private retryUtil: RetryUtil,
  ) {
    // Primary = Sarvam
    this.sarvamApiKey = this.config.get<string>(
      'SARVAM_API_KEY',
      '',
    );

    this.sarvamModel = this.config.get<string>(
      'SARVAM_MODEL',
      'sarvam-105b',
    );

    // Fallback = Groq
    this.fallbackProvider = this.config.get<string>(
      'LLM_FALLBACK_PROVIDER',
      'groq',
    );

    this.groqApiKey = this.config.get<string>(
      'GROQ_API_KEY',
    );

    this.groqModel = this.config.get<string>(
      'GROQ_MODEL',
      'llama-3.3-70b-versatile',
    );
  }

  async structuredExtraction(
    params: StructuredExtractionParams,
  ): Promise<Record<string, any>> {
    try {
      return await this.retryUtil.withRetry(
        () => this.sarvamStructuredCall(params),
        {
          maxRetries: 2,
          context: 'Sarvam.structuredExtraction',
        },
      );
    } catch (err) {
      if (
        this.fallbackProvider === 'groq' &&
        this.groqApiKey
      ) {
        this.logger.warn(
          'Sarvam failed, falling back to Groq',
        );

        return this.retryUtil.withRetry(
          () => this.groqStructuredCall(params),
          {
            maxRetries: 2,
            context: 'Groq.structuredExtraction',
          },
        );
      }

      throw err;
    }
  }

  async chatCompletion(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
    },
  ): Promise<string> {
    try {
      const result = await this.retryUtil.withRetry(
        () => this.sarvamChat(messages, options),
        {
          maxRetries: 2,
          context: 'Sarvam.chatCompletion',
        },
      );

      if (!result?.trim()) {
        throw new Error('Sarvam returned an empty response');
      }

      return result.trim();
    } catch (err) {
      this.logger.error(
        `Sarvam chatCompletion failed: ${err instanceof Error ? err.message : String(err)
        }`,
      );

      if (this.fallbackProvider === 'groq' && this.groqApiKey) {
        this.logger.warn(
          'Sarvam failed, falling back to Groq',
        );

        const result = await this.retryUtil.withRetry(
          () => this.groqChat(messages, options),
          {
            maxRetries: 2,
            context: 'Groq.chatCompletion',
          },
        );

        if (!result?.trim()) {
          throw new Error('Groq returned an empty response');
        }

        return result.trim();
      }

      throw err;
    }
  }


  async summarize(
    transcript: string,
    systemPrompt: string,
  ): Promise<string> {

    const result = await this.chatCompletion(
      [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      {
        temperature: 0.3,
      },
    );

    return result;
  }


  // ============================================
  // SARVAM PRIMARY
  // ============================================

  private async sarvamStructuredCall(
    params: StructuredExtractionParams,
  ): Promise<Record<string, any>> {
    const response = await fetch(
      `${this.sarvamBaseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'api-subscription-key': this.sarvamApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: params.model || this.sarvamModel,
          messages: params.messages,
          temperature: params.temperature ?? 0.1,
          max_tokens: 4096,
          response_format: {
            type: 'json_object',
          },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Sarvam structured call failed: ${response.status} ${text}`,
      );
    }

    const data = await response.json() as any;

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Sarvam returned empty content');
    }

    try {
      return JSON.parse(content);
    } catch (err) {
      throw new Error(
        `Sarvam returned invalid JSON: ${content}`,
      );
    }
  }

  private async sarvamChat(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
    },
  ): Promise<string> {
    const response = await fetch(
      `${this.sarvamBaseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'api-subscription-key': this.sarvamApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options?.model || this.sarvamModel,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: 4096,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Sarvam chat failed: ${response.status} ${text}`,
      );
    }

    const data = await response.json() as any;

    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error(
        `Sarvam returned empty/invalid content: ${JSON.stringify(data)}`,
      );
    }

    return content.trim();
  }


  // ============================================
  // GROQ FALLBACK
  // ============================================

  private async groqStructuredCall(
    params: StructuredExtractionParams,
  ): Promise<Record<string, any>> {
    const messages = [...params.messages];

    messages.push({
      role: 'system',
      content:
        `You must respond with valid JSON matching this schema: ` +
        JSON.stringify(params.schema),
    });

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          model: this.groqModel,
          messages,

          temperature:
            params.temperature ?? 0.1,

          response_format: {
            type: 'json_object',
          },
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Groq structured call failed: ${response.status} ${text}`,
      );
    }

    const data = await response.json() as any;

    return JSON.parse(
      data.choices?.[0]?.message?.content || '{}',
    );
  }

  private async groqChat(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
    },
  ): Promise<string> {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          model:
            options?.model || this.groqModel,

          messages,

          temperature:
            options?.temperature ?? 0.7,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Groq chat failed: ${response.status} ${text}`,
      );
    }

    const data = await response.json() as any;

    return (
      data.choices?.[0]?.message?.content || ''
    );
  }
}