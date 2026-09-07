import { ConfigService } from '@nestjs/config';
import { RetryUtil } from '../common/utils/retry.util';
import { SarvamSttParams, SarvamSttResult, SarvamTtsParams, SarvamTtsResult } from './sarvam-provider.interface';
export declare class SarvamProvider {
    private config;
    private retryUtil;
    private readonly logger;
    private readonly apiKey;
    private readonly sttUrl;
    private readonly ttsUrl;
    constructor(config: ConfigService, retryUtil: RetryUtil);
    speechToText(params: SarvamSttParams): Promise<SarvamSttResult>;
    textToSpeech(params: SarvamTtsParams): Promise<SarvamTtsResult>;
}
