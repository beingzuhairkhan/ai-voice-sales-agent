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

  private readonly developerMobile: string;
  private readonly resumeUrl: string;
  private readonly systemOverviewUrl: string;

  constructor(private config: ConfigService, private retryUtil: RetryUtil) {
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID', '');
    this.apiUrl = this.config.get<string>('WHATSAPP_API_URL', 'https://graph.facebook.com/v20.0');
    this.developerMobile =
      process.env.DEVELOPER_MOBILE || '';

    this.resumeUrl =
      process.env.RESUME_URL || '';

    this.systemOverviewUrl =
      process.env.SYSTEM_OVERVIEW_URL || '';
  }


  private extractTemplateParams(message: string): any {
    const text = message.trim();

    try {
      if (text.startsWith('{') && text.endsWith('}')) {
        const parsed = JSON.parse(text);
        return {
          businessName: parsed.businessName || "your business",
          productCount: parsed.productCount || "the required",
          budget: parsed.budget || "to be discussed",
          timeline: parsed.timeline || "to be discussed",
          requiredFeatures: parsed.requiredFeatures || "the required features",
          developerMobile: parsed.developerMobile || this.developerMobile || "+919967705134",
          resumeUrl: parsed.resumeUrl || this.resumeUrl || "https://example.com",
          systemOverviewUrl: parsed.systemOverviewUrl || this.systemOverviewUrl || "https://example.com",
        };
      }
    } catch (e) {
      // Fallback if it's plain text
    }

    return {
      businessName: "your business",
      productCount: "the required",
      budget: "to be discussed",
      timeline: "to be discussed",
      requiredFeatures: "the required features",
      developerMobile: this.developerMobile || "+919967705134",
      resumeUrl: this.resumeUrl || "https://example.com",
      systemOverviewUrl: this.systemOverviewUrl || "https://example.com",
    };
  }
  async sendTextMessage(
    to: string,
    body: string
  ): Promise<WhatsAppSendResult> {
    return this.retryUtil.withRetry(
      async () => {
        // console.log("Sending WhatsApp message to:", body);
        const params = this.extractTemplateParams(body);

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
                name: 'ecommerce_lead_followup_v2',

                language: {
                  code: 'en',
                },

                components: [
                  {
                    type: 'body',

                    parameters: [
                      {
                        type: 'text',
                        text: params.businessName,
                      },
                      {
                        type: 'text',
                        text: params.productCount,
                      },
                      {
                        type: 'text',
                        text: params.budget,
                      },
                      {
                        type: 'text',
                        text: params.timeline,
                      },
                      {
                        type: 'text',
                        text: params.requiredFeatures,
                      },
                      {
                        type: 'text',
                        text: params.developerMobile,
                      },
                      {
                        type: 'text',
                        text: params.resumeUrl,
                      },
                      {
                        type: 'text',
                        text: params.systemOverviewUrl,
                      },
                    ],
                  },
                ],
              },
            }),
          }
        );

        return this.parseResponse(response);
      },
      {
        maxRetries: 2,
        context: 'WhatsApp.sendText',
      }
    );
  }

  async sendHotMidCall(
    to: string,
    summary: string,
  ): Promise<WhatsAppSendResult> {
    console.log("Sending WhatsApp hot mid-call message to:", to, "with summary:", summary);
    const sanitizedSummary = summary.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    return this.retryUtil.withRetry(
      async () => {
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
                name: 'hot_mid_call',
                language: {
                  code: 'en',
                },

                components: [
                  {
                    type: 'body',
                    parameters: [
                      {
                        type: 'text',
                        text: sanitizedSummary,
                      },
                    ],
                  },
                ],
              },
            }),
          },
        );

        return this.parseResponse(response);
      },
      {
        maxRetries: 2,
        context: 'WhatsApp.sendHotMidCall',
      },
    );
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
