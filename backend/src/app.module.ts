import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { CommonModule } from './common/common.module';
import { ConfigValidation } from './config/config-validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CallsModule } from './calls/calls.module';
import { VoiceModule } from './voice/voice.module';
import { VapiModule } from './vapi/vapi.module';
import { SarvamModule } from './sarvam/sarvam.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ConversationsModule } from './conversations/conversations.module';
import { LeadsModule } from './leads/leads.module';
import { QualificationModule } from './qualification/qualification.module';
import { AiModule } from './ai/ai.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { CallbackModule } from './callback/callback.module';
import { CalendarModule } from './calendar/calendar.module';
import { FollowupModule } from './followup/followup.module';
import { JobsModule } from './jobs/jobs.module';
import { FilesModule } from './files/files.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: ConfigValidation,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport:
            config.get<string>('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers["authorization"]',
              'req.headers.cookie',
              '*.apiKey',
              '*.api_key',
              '*.accessToken',
              '*.access_token',
              '*.refreshToken',
              '*.refresh_token',
              '*.password',
              '*.token',
            ],
            censor: '[REDACTED]',
          },
          genReqCustomProps: (req: any) => ({
            requestId: (req.headers['x-request-id'] as string) || (req as any).id,
          }),
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => [{ ttl: 60000, limit: 100 }],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        
      }),
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    CallsModule,
    VoiceModule,
    VapiModule,
    SarvamModule,
    WebhooksModule,
    ConversationsModule,
    LeadsModule,
    QualificationModule,
    AiModule,
    WhatsAppModule,
    CallbackModule,
    CalendarModule,
    FollowupModule,
    JobsModule,
    FilesModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
