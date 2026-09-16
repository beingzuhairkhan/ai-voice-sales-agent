import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema } from '../calls/call.schema';
import { Lead, LeadSchema } from '../leads/lead.schema';
import { ActionEvent, ActionEventSchema } from '../common/types/action-event.schema';
import { FollowupOrchestratorService } from './followup-orchestrator.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { AiModule } from '../ai/ai.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Call.name, schema: CallSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: ActionEvent.name, schema: ActionEventSchema },
    ]),
    WhatsAppModule,
    AiModule,
    ConversationsModule,
  ],
  providers: [FollowupOrchestratorService],
  exports: [FollowupOrchestratorService],
})
export class FollowupModule {}
