import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './lead.schema';
import { LeadsService } from './leads.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }])],
  providers: [LeadsService],
  exports: [LeadsService, MongooseModule],
})
export class LeadsModule {}
