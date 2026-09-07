import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema } from '../calls/call.schema';
import { Lead, LeadSchema } from '../leads/lead.schema';
import { ActionEvent, ActionEventSchema } from '../common/types/action-event.schema';
import { VoiceToolsController } from './voice-tools.controller';
import { VoiceToolsService } from './voice-tools.service';
import { LeadsModule } from '../leads/leads.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { AiModule } from '../ai/ai.module';
import { QualificationModule } from '../qualification/qualification.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { CallbackModule } from '../callback/callback.module';
import { VapiModule } from '../vapi/vapi.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Call.name, schema: CallSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: ActionEvent.name, schema: ActionEventSchema },
    ]),
    LeadsModule,
    ConversationsModule,
    AiModule,
    QualificationModule,
    WhatsAppModule,
    CallbackModule,
    VapiModule,
  ],
  controllers: [VoiceToolsController],
  providers: [VoiceToolsService],
})
export class VoiceModule {}
