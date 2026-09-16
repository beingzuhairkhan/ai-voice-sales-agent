import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WhatsAppMessageType = 'text' | 'document' | 'image' | 'template';
export type WhatsAppMessageStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'pending';

export type WhatsAppMessageDocument = WhatsAppMessage & Document;

@Schema({ timestamps: true, collection: 'whatsapp_messages' })
export class WhatsAppMessage {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Lead', index: true })
  leadId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  phoneNumber!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ enum: ['text', 'document', 'image', 'template'], default: 'text' })
  type!: WhatsAppMessageType;

  @Prop({ enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'pending'], default: 'queued', index: true })
  status!: WhatsAppMessageStatus;

  @Prop({ type: String, index: true, sparse: true })
  providerMessageId?: string;

  @Prop({ type: Date })
  sentAt?: Date;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Object, default: {} })
  deliveryInfo!: Record<string, any>;

  @Prop({ type: Object, default: {} })
  errorInfo!: Record<string, any>;

  @Prop({ type: String })
  mediaUrl?: string;

  @Prop({ type: String })
  mediaId?: string;

  @Prop({ type: String })
  triggerAction?: string; // e.g., HOT_MID_CALL, POST_CALL_FOLLOWUP

  createdAt!: Date;
  updatedAt!: Date;
}

export const WhatsAppMessageSchema = SchemaFactory.createForClass(WhatsAppMessage);
WhatsAppMessageSchema.index({ status: 1, createdAt: -1 });
