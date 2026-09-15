// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { RetryUtil } from '../common/utils/retry.util';
// import {
//   ChatMessage,
//   LlmProvider,
//   StructuredExtractionParams,
// } from './llm-provider.interface';

// /**
//  * OpenAI LLM adapter — primary reasoning layer.
//  * Uses OpenAI Chat Completions + JSON mode for structured extraction.
//  * Optional Groq/Llama fallback configurable via OPENAI_FALLBACK_PROVIDER.
//  */
// @Injectable()
// export class OpenAiProvider implements LlmProvider {
//   private readonly logger = new Logger(OpenAiProvider.name);
//   private readonly apiKey: string;
//   private readonly model: string;
//   private readonly fallbackProvider?: string;
//   private readonly groqApiKey?: string;
//   private readonly groqModel?: string;
//   private readonly baseUrl = 'https://api.openai.com/v1';

//   constructor(private config: ConfigService, private retryUtil: RetryUtil) {
//     this.apiKey = this.config.get<string>('OPENAI_API_KEY', '');
//     this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o');
//     this.fallbackProvider = this.config.get<string>('OPENAI_FALLBACK_PROVIDER');
//     this.groqApiKey = this.config.get<string>('GROQ_API_KEY');
//     this.groqModel = this.config.get<string>('GROQ_MODEL', 'llama-3.3-70b-versatile');
//   }

//   async structuredExtraction(params: StructuredExtractionParams): Promise<Record<string, any>> {
//     try {
//       return await this.retryUtil.withRetry(
//         () => this.openAiStructuredCall(params),
//         { maxRetries: 2, context: 'OpenAI.structuredExtraction' },
//       );
//     } catch (err) {
//       if (this.fallbackProvider === 'groq' && this.groqApiKey) {
//         this.logger.warn('OpenAI failed, falling back to Groq');
//         return this.retryUtil.withRetry(
//           () => this.groqStructuredCall(params),
//           { maxRetries: 2, context: 'Groq.structuredExtraction' },
//         );
//       }
//       throw err;
//     }
//   }

//   async chatCompletion(
//     messages: ChatMessage[],
//     options?: { model?: string; temperature?: number },
//   ): Promise<string> {
//     try {
//       return await this.retryUtil.withRetry(
//         () => this.openAiChat(messages, options),
//         { maxRetries: 2, context: 'OpenAI.chatCompletion' },
//       );
//     } catch (err) {
//       if (this.fallbackProvider === 'groq' && this.groqApiKey) {
//         return this.retryUtil.withRetry(
//           () => this.groqChat(messages, options),
//           { maxRetries: 2, context: 'Groq.chatCompletion' },
//         );
//       }
//       throw err;
//     }
//   }

//   async summarize(transcript: string, systemPrompt: string): Promise<string> {
//     return this.chatCompletion(
//       [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: transcript },
//       ],
//       { temperature: 0.3 },
//     );
//   }

//   private async openAiStructuredCall(params: StructuredExtractionParams): Promise<Record<string, any>> {
//     const response = await fetch(`${this.baseUrl}/chat/completions`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${this.apiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: params.model || this.model,
//         messages: params.messages,
//         temperature: params.temperature ?? 0.1,
//         response_format: { type: 'json_object' },
//       }),
//     });
//     if (!response.ok) {
//       const text = await response.text();
//       throw new Error(`OpenAI structured call failed: ${response.status} ${text}`);
//     }
//     const data = await response.json() as any;
//     const content = data.choices?.[0]?.message?.content || '{}';
//     return JSON.parse(content);
//   }

//   private async openAiChat(
//     messages: ChatMessage[],
//     options?: { model?: string; temperature?: number },
//   ): Promise<string> {
//     const response = await fetch(`${this.baseUrl}/chat/completions`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${this.apiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: options?.model || this.model,
//         messages,
//         temperature: options?.temperature ?? 0.7,
//       }),
//     });
//     if (!response.ok) {
//       const text = await response.text();
//       throw new Error(`OpenAI chat failed: ${response.status} ${text}`);
//     }
//     const data = await response.json() as any;
//     return data.choices?.[0]?.message?.content || '';
//   }

//   private async groqStructuredCall(params: StructuredExtractionParams): Promise<Record<string, any>> {
//     const messages = [...params.messages];
//     messages.push({
//       role: 'system',
//       content: `You must respond with valid JSON matching this schema: ${JSON.stringify(params.schema)}`,
//     });
//     const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${this.groqApiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: this.groqModel,
//         messages,
//         temperature: params.temperature ?? 0.1,
//         response_format: { type: 'json_object' },
//       }),
//     });
//     if (!response.ok) {
//       const text = await response.text();
//       throw new Error(`Groq structured call failed: ${response.status} ${text}`);
//     }
//     const data = await response.json() as any;
//     return JSON.parse(data.choices?.[0]?.message?.content || '{}');
//   }

//   private async groqChat(
//     messages: ChatMessage[],
//     options?: { model?: string; temperature?: number },
//   ): Promise<string> {
//     const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${this.groqApiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: this.groqModel,
//         messages,
//         temperature: options?.temperature ?? 0.7,
//       }),
//     });
//     if (!response.ok) {
//       const text = await response.text();
//       throw new Error(`Groq chat failed: ${response.status} ${text}`);
//     }
//     const data = await response.json() as any;
//     return data.choices?.[0]?.message?.content || '';
//   }
// }

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
      return await this.retryUtil.withRetry(
        () => this.sarvamChat(messages, options),
        {
          maxRetries: 2,
          context: 'Sarvam.chatCompletion',
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
          () => this.groqChat(messages, options),
          {
            maxRetries: 2,
            context: 'Groq.chatCompletion',
          },
        );
      }

      throw err;
    }
  }

  async summarize(
    transcript: string,
    systemPrompt: string,
  ): Promise<string> {
    console.log("transcript",transcript)
    return this.chatCompletion(
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
      console.error('SARVAM INVALID JSON:', content);

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
          model:
            options?.model || this.sarvamModel,

          messages,

          temperature:
            options?.temperature ?? 0.7,
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

    return (
      data.choices?.[0]?.message?.content || ''
    );
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