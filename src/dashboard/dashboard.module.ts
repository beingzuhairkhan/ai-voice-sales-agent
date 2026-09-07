import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema } from '../calls/call.schema';
import { Lead, LeadSchema } from '../leads/lead.schema';
import { Callback, CallbackSchema } from '../callback/callback.schema';
import { WhatsAppMessage, WhatsAppMessageSchema } from '../whatsapp/whatsapp-message.schema';
import { ActionEvent, ActionEventSchema } from '../common/types/action-event.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { LeadsModule } from '../leads/leads.module';
import { CallbackModule } from '../callback/callback.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Call.name, schema: CallSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Callback.name, schema: CallbackSchema },
      { name: WhatsAppMessage.name, schema: WhatsAppMessageSchema },
      { name: ActionEvent.name, schema: ActionEventSchema },
    ]),
    LeadsModule,
    CallbackModule,
    WhatsAppModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
