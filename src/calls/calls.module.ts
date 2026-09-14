import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema } from './call.schema';
import { ActionEvent, ActionEventSchema } from '../common/types/action-event.schema';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { VapiModule } from '../vapi/vapi.module';
import { LeadsModule } from '@/leads/leads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Call.name, schema: CallSchema },
      { name: ActionEvent.name, schema: ActionEventSchema },
    ]),
    VapiModule,
    LeadsModule,
  ],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService, MongooseModule],
})
export class CallsModule {}
