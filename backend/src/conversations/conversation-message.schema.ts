import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageRole = 'assistant' | 'user' | 'system' | 'tool';

export type ConversationMessageDocument = ConversationMessage & Document;

@Schema({ timestamps: true, collection: 'conversation_messages' })
export class ConversationMessage {
  _id!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Call', index: true })
  callId!: Types.ObjectId;

  @Prop({ required: true, enum: ['assistant', 'user', 'system', 'tool'] })
  role!: MessageRole;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: 'unknown' })
  language!: string;

  @Prop({ type: Date, default: Date.now })
  timestamp!: Date;

  @Prop({ type: String, index: true, sparse: true })
  providerEventId?: string;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, any>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ConversationMessageSchema = SchemaFactory.createForClass(ConversationMessage);
ConversationMessageSchema.index({ callId: 1, timestamp: 1 });
