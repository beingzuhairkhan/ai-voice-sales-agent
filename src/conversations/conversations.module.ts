import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationMessage, ConversationMessageSchema } from './conversation-message.schema';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConversationMessage.name, schema: ConversationMessageSchema },
    ]),
  ],
  providers: [ConversationsService],
  exports: [ConversationsService, MongooseModule],
})
export class ConversationsModule {}
