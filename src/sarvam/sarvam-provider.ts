import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetryUtil } from '../common/utils/retry.util';
import {
  SarvamSttParams,
  SarvamSttResult,
  SarvamTtsParams,
  SarvamTtsResult,
} from './sarvam-provider.interface';

/**
 * Sarvam AI adapter — Indian-language STT/TTS.
 * Configured via SARVAM_API_KEY.
 */
@Injectable()
export class SarvamProvider {
  private readonly logger = new Logger(SarvamProvider.name);
  private readonly apiKey: string;
  private readonly sttUrl: string;
  private readonly ttsUrl: string;

  constructor(private config: ConfigService, private retryUtil: RetryUtil) {
    this.apiKey = this.config.get<string>('SARVAM_API_KEY', '');
    this.sttUrl = this.config.get<string>('SARVAM_STT_API_URL', 'https://api.sarvam.ai/speech-to-text');
    this.ttsUrl = this.config.get<string>('SARVAM_TTS_API_URL', 'https://api.sarvam.ai/text-to-speech');
  }

  async speechToText(params: SarvamSttParams): Promise<SarvamSttResult> {
    if (!this.apiKey) {
      throw new Error('SARVAM_API_KEY not configured');
    }
    return this.retryUtil.withRetry(async () => {
      const body: Record<string, any> = {
        language: params.language || 'auto',
      };
      if (params.audioBase64) body.audio_base64 = params.audioBase64;
      if (params.audioUrl) body.audio_url = params.audioUrl;

      const response = await fetch(this.sttUrl, {
        method: 'POST',
        headers: {
          'api-subscription-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Sarvam STT failed: ${response.status} ${text}`);
      }
      const data = await response.json() as any;
      return {
        transcript: data.transcript || '',
        language: data.language_code || params.language || 'unknown',
        confidence: data.confidence,
      };
    }, { context: 'Sarvam.speechToText' });
  }

  async textToSpeech(params: SarvamTtsParams): Promise<SarvamTtsResult> {
    if (!this.apiKey) {
      throw new Error('SARVAM_API_KEY not configured');
    }
    return this.retryUtil.withRetry(async () => {
      const body: Record<string, any> = {
        text: params.text,
        language: params.language,
        voice: params.voice || 'default',
        speed: params.speed || 1.0,
      };
      const response = await fetch(this.ttsUrl, {
        method: 'POST',
        headers: {
          'api-subscription-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Sarvam TTS failed: ${response.status} ${text}`);
      }
      const data = await response.json() as any;
      return {
        audioBase64: data.audio_base64 || data.audio || '',
        format: data.format || 'wav',
      };
    }, { context: 'Sarvam.textToSpeech' });
  }
}
