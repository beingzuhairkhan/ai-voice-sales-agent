import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FileConfig {
  resumeUrl: string;
  architectureImageUrl: string;
  developerName: string;
  developerMobileNumber: string;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private config: ConfigService) {}

  getFileConfig(): FileConfig {
    return {
      resumeUrl: this.config.get<string>('RESUME_URL', ''),
      architectureImageUrl: this.config.get<string>('ARCHITECTURE_IMAGE_URL', ''),
      developerName: this.config.get<string>('DEVELOPER_NAME', ''),
      developerMobileNumber: this.config.get<string>('DEVELOPER_MOBILE_NUMBER', ''),
    };
  }

  validateFileUrls(): { resumeValid: boolean; architectureValid: boolean } {
    const config = this.getFileConfig();
    return {
      resumeValid: Boolean(config.resumeUrl),
      architectureValid: Boolean(config.architectureImageUrl),
    };
  }
}
