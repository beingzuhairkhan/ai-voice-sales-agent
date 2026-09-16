import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConversationMessage, MessageRole } from './conversation-message.schema';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectModel(ConversationMessage.name) private messageModel: Model<ConversationMessage>,
  ) {}

  async addMessage(params: {
    callId: Types.ObjectId | string;
    role: MessageRole;
    message: string;
    language?: string;
    providerEventId?: string;
    metadata?: Record<string, any>;
  }): Promise<ConversationMessage> {
    // Idempotency: if providerEventId exists, skip
    if (params.providerEventId) {
      const existing = await this.messageModel.findOne({ providerEventId: params.providerEventId }).exec();
      if (existing) return existing;
    }

    return this.messageModel.create({
      callId: typeof params.callId === 'string' ? new Types.ObjectId(params.callId) : params.callId,
      role: params.role,
      message: params.message,
      language: params.language || 'unknown',
      providerEventId: params.providerEventId,
      metadata: params.metadata || {},
    });
  }

  async getConversation(callId: Types.ObjectId | string): Promise<ConversationMessage[]> {
    return this.messageModel
      .find({ callId: typeof callId === 'string' ? new Types.ObjectId(callId) : callId })
      .sort({ timestamp: 1 })
      .exec();
  }

  async getTranscriptText(callId: Types.ObjectId | string): Promise<string> {
    const messages = await this.getConversation(callId);
    return messages.map((m) => `${m.role.toUpperCase()}: ${m.message}`).join('\n');
  }
}
