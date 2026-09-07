import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VoiceToolAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const expectedSecret =
      this.config.get<string>('VAPI_WEBHOOK_SECRET');

    // Dev mode: if secret is not configured, allow request
    if (!expectedSecret) {
      return true;
    }

    const authorization = request.headers['authorization'];

    const expectedAuthorization = `Bearer ${expectedSecret}`;

    if (authorization !== expectedAuthorization) {
      request.log?.warn?.(
        {
          hasAuthorization: !!authorization,
        },
        'Vapi tool authorization mismatch',
      );

      throw new UnauthorizedException('Invalid authorization');
    }

    return true;
  }
}