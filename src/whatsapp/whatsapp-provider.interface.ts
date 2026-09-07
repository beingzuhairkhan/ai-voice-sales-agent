
export interface WhatsAppSendResult {
  providerMessageId: string;
  status: string;
  rawResponse?: Record<string, any>;
}

export interface WhatsAppProvider {
  sendTextMessage(to: string, body: string): Promise<WhatsAppSendResult>;
  sendDocument(to: string, documentUrl: string, caption?: string): Promise<WhatsAppSendResult>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppSendResult>;
}

export const WHATSAPP_PROVIDER = 'WHATSAPP_PROVIDER';
