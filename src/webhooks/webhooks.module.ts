import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhookEvent, WebhookEventSchema } from './webhook-event.schema';
import { ActionEvent, ActionEventSchema } from '../common/types/action-event.schema';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { CallsModule } from '../calls/calls.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { LeadsModule } from '../leads/leads.module';
import { AiModule } from '../ai/ai.module';
import { QualificationModule } from '../qualification/qualification.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { FOLLOWUP_QUEUE } from '@/jobs/jobs.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: FOLLOWUP_QUEUE,
    }),
    MongooseModule.forFeature([
      { name: WebhookEvent.name, schema: WebhookEventSchema },
      { name: ActionEvent.name, schema: ActionEventSchema },
    ]),
    CallsModule,
    ConversationsModule,
    LeadsModule,
    AiModule,
    QualificationModule,
    WhatsAppModule,
    
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
