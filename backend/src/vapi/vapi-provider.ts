import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetryUtil } from '../common/utils/retry.util';
import {
  VapiAssistantConfig,
  VapiCallInfo,
  VapiStartCallParams,
  VapiStartCallResult,
} from './vapi-provider.interface';

/**
 * Vapi API adapter — isolates Vapi REST calls.
 * All Vapi-specific knowledge lives here so callers stay version-agnostic.
 */
@Injectable()
export class VapiProvider {
  private readonly logger = new Logger(VapiProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.vapi.ai';
  private readonly assistantId: string;
  private readonly phoneNumberId?: string;
  private readonly callerNumber?: string;

  constructor(private config: ConfigService, private retryUtil: RetryUtil) {
    this.apiKey = this.config.get<string>('VAPI_API_KEY', '');
    this.assistantId = this.config.get<string>('VAPI_ASSISTANT_ID', '');
    this.phoneNumberId = this.config.get<string>('VAPI_PHONE_NUMBER_ID');
    this.callerNumber = this.config.get<string>('VAPI_PHONE_NUMBER');
  }

  async startOutboundCall(params: VapiStartCallParams): Promise<VapiStartCallResult> {
    const body: Record<string, any> = {
      assistantId: params.assistantId || this.assistantId,
      customer: {
        number: params.phoneNumber,
      },
    };
    if (params.phoneNumberId || this.phoneNumberId) {
      body.phoneNumberId = params.phoneNumberId || this.phoneNumberId;
    }
    if (params.metadata) {
      body.metadata = params.metadata;
    }

    return this.retryUtil.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Vapi startOutboundCall failed: ${response.status} ${text}`);
      }
      const data = await response.json() as any;
      return {
        vapiCallId: data.id,
        status: data.status || 'initiated',
        metadata: data,
      };
    }, { context: 'Vapi.startOutboundCall' });
  }

  async getCall(vapiCallId: string): Promise<VapiCallInfo> {
    return this.retryUtil.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/call/${vapiCallId}`, {
        method: 'GET',
        headers: this.headers(),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Vapi getCall failed: ${response.status} ${text}`);
      }
      const data = await response.json() as any;
      return this.mapCallInfo(data);
    }, { context: 'Vapi.getCall' });
  }

  async createAssistant(config: VapiAssistantConfig): Promise<{ id: string }> {
    return this.retryUtil.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/assistant`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Vapi createAssistant failed: ${response.status} ${text}`);
      }
      const data = await response.json() as any;
      return { id: data.id };
    }, { context: 'Vapi.createAssistant' });
  }

  async updateAssistant(assistantId: string, config: Partial<VapiAssistantConfig>): Promise<void> {
    await this.retryUtil.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
        method: 'PATCH',
        headers: this.headers(),
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Vapi updateAssistant failed: ${response.status} ${text}`);
      }
    }, { context: 'Vapi.updateAssistant' });
  }

  async endCall(vapiCallId: string): Promise<void> {
    await this.retryUtil.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/call/${vapiCallId}`, {
        method: 'DELETE',
        headers: this.headers(),
      });
      if (!response.ok && response.status !== 404) {
        const text = await response.text();
        throw new Error(`Vapi endCall failed: ${response.status} ${text}`);
      }
    }, { maxRetries: 1, context: 'Vapi.endCall' });
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private mapCallInfo(data: any): VapiCallInfo {
    return {
      id: data.id,
      status: data.status,
      transcript: data.transcript,
      recordingUrl: data.recordingUrl,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      durationSeconds: data.durationSeconds,
      metadata: data.metadata,
    };
  }
}
