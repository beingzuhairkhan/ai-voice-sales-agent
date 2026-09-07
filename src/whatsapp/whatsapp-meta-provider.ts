import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RetryUtil } from '../common/utils/retry.util';
import { WhatsAppProvider, WhatsAppSendResult } from './whatsapp-provider.interface';

/**
 * Meta WhatsApp Business Cloud API adapter.
 * Uses WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID.
 */
@Injectable()
export class WhatsAppMetaProvider implements WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppMetaProvider.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiUrl: string;

  constructor(private config: ConfigService, private retryUtil: RetryUtil) {
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.apiUrl = this.config.get<string>('WHATSAPP_API_URL', 'https://graph.facebook.com/v20.0');
  }
async sendTextMessage(
  to: string,
  body: string
): Promise<WhatsAppSendResult> {
  return this.retryUtil.withRetry(async () => {
    const response = await fetch(
      `${this.apiUrl}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: this.normalizeNumber(to),
          type: 'template',
          template: {
            name: 'jaspers_market_plain_text_v1',
            language: {
              code: 'en_US',
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: body,
                  },
                ],
              },
            ],
          },
        }),
      }
    );

    return this.parseResponse(response);
  }, {
    maxRetries: 2,
    context: 'WhatsApp.sendTemplate',
  });
}

  async sendDocument(to: string, documentUrl: string, caption?: string): Promise<WhatsAppSendResult> {
    return this.retryUtil.withRetry(async () => {
      const payload: Record<string, any> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizeNumber(to),
        type: 'document',
        document: { link: documentUrl, caption },
      };
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      });
      return this.parseResponse(response);
    }, { maxRetries: 2, context: 'WhatsApp.sendDocument' });
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppSendResult> {
    return this.retryUtil.withRetry(async () => {
      const payload: Record<string, any> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizeNumber(to),
        type: 'image',
        image: { link: imageUrl, caption },
      };
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      });
      return this.parseResponse(response);
    }, { maxRetries: 2, context: 'WhatsApp.sendImage' });
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private normalizeNumber(phone: string): string {
    let num = phone.replace(/[^\d]/g, '');
    if (num.startsWith('91') && num.length === 12) return num;
    if (num.length === 10) return `91${num}`;
    return num;
  }

  private async parseResponse(response: Response): Promise<WhatsAppSendResult> {
    const data = await response.json() as any;
    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      throw new Error(`WhatsApp send failed: ${errMsg}`);
    }
    const messageId = data?.messages?.[0]?.id || 'unknown';
    return { providerMessageId: messageId, status: 'sent', rawResponse: data };
  }
}
