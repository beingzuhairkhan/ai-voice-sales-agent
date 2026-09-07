import { ConfigService } from '@nestjs/config';
import { RetryUtil } from '../common/utils/retry.util';
import { VapiAssistantConfig, VapiCallInfo, VapiStartCallParams, VapiStartCallResult } from './vapi-provider.interface';
export declare class VapiProvider {
    private config;
    private retryUtil;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    private readonly assistantId;
    private readonly phoneNumberId?;
    private readonly callerNumber?;
    constructor(config: ConfigService, retryUtil: RetryUtil);
    startOutboundCall(params: VapiStartCallParams): Promise<VapiStartCallResult>;
    getCall(vapiCallId: string): Promise<VapiCallInfo>;
    createAssistant(config: VapiAssistantConfig): Promise<{
        id: string;
    }>;
    updateAssistant(assistantId: string, config: Partial<VapiAssistantConfig>): Promise<void>;
    endCall(vapiCallId: string): Promise<void>;
    private headers;
    private mapCallInfo;
}
