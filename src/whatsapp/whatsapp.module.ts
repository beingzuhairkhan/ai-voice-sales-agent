import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppMessage, WhatsAppMessageSchema } from './whatsapp-message.schema';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppMetaProvider } from './whatsapp-meta-provider';
import { WHATSAPP_PROVIDER } from './whatsapp-provider.interface';
import { WhatsAppController } from './whatsapp.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhatsAppMessage.name, schema: WhatsAppMessageSchema },
    ]),
  ],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    { provide: WHATSAPP_PROVIDER, useClass: WhatsAppMetaProvider },
  ],
  exports: [WhatsAppService, MongooseModule],
})
export class WhatsAppModule {}
