import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema } from '../calls/call.schema';
import { JobsService } from './jobs.service';
import { FollowupModule } from '../followup/followup.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Call.name, schema: CallSchema }]),
    FollowupModule,
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
