import { ConfigService } from '@nestjs/config';
import { RetryUtil } from '../common/utils/retry.util';
import { WhatsAppProvider, WhatsAppSendResult } from './whatsapp-provider.interface';
export declare class WhatsAppMetaProvider implements WhatsAppProvider {
    private config;
    private retryUtil;
    private readonly logger;
    private readonly accessToken;
    private readonly phoneNumberId;
    private readonly apiUrl;
    constructor(config: ConfigService, retryUtil: RetryUtil);
    sendTextMessage(to: string, body: string): Promise<WhatsAppSendResult>;
    sendDocument(to: string, documentUrl: string, caption?: string): Promise<WhatsAppSendResult>;
    sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppSendResult>;
    private headers;
    private normalizeNumber;
    private parseResponse;
}
