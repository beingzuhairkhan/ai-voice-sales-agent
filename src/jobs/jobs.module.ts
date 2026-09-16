import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema } from '../calls/call.schema';
import { JobsService } from './jobs.service';
import { FollowupModule } from '../followup/followup.module';
import { CallbackModule } from '@/callback/callback.module';
import { LeadsModule } from '@/leads/leads.module';
import { ConversationsModule } from '@/conversations/conversations.module';
import { CallsModule } from '@/calls/calls.module';
import { Callback , CallbackSchema } from '@/callback/callback.schema';
import {Lead, LeadSchema } from '@/leads/lead.schema';

@Module({
  imports: [
   MongooseModule.forFeature([
      {
        name: Call.name,
        schema: CallSchema,
      },
      {
        name: Callback.name,
        schema: CallbackSchema,
      },
      {
        name: Lead.name,
        schema: LeadSchema,
      },
    ]),
    FollowupModule,
    CallbackModule,
    LeadsModule,
    ConversationsModule,
    CallsModule
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
