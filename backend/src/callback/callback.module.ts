import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Callback, CallbackSchema } from './callback.schema';
import { CallbackService } from './callback.service';
import { CallbackParserService } from './callback-parser.service';
import { AiModule } from '../ai/ai.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Callback.name, schema: CallbackSchema }]),
    AiModule,
    CalendarModule,
  ],
  providers: [CallbackService, CallbackParserService],
  exports: [CallbackService, CallbackParserService, MongooseModule],
})
export class CallbackModule {}
