import { ConfigService } from '@nestjs/config';
export interface FileConfig {
    resumeUrl: string;
    architectureImageUrl: string;
    developerName: string;
    developerMobileNumber: string;
}
export declare class FilesService {
    private config;
    private readonly logger;
    constructor(config: ConfigService);
    getFileConfig(): FileConfig;
    validateFileUrls(): {
        resumeValid: boolean;
        architectureValid: boolean;
    };
}
