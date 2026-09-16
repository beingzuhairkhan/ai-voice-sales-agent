import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebhookProvider = 'vapi' | 'whatsapp' | 'sarvam' | 'internal';
export type WebhookEventStatus = 'received' | 'processed' | 'duplicate' | 'failed' | 'ignored';

export type WebhookEventDocument = WebhookEvent & Document;

@Schema({ timestamps: true, collection: 'webhook_events' })
export class WebhookEvent {
  _id!: Types.ObjectId;

  @Prop({ required: true, enum: ['vapi', 'whatsapp', 'sarvam', 'internal'] })
  provider!: WebhookProvider;

  @Prop({ required: true, type: String, index: true, unique: true })
  providerEventId!: string;

  @Prop({ type: String })
  eventType?: string;

  @Prop({ enum: ['received', 'processed', 'duplicate', 'failed', 'ignored'], default: 'received' })
  status!: WebhookEventStatus;

  @Prop({ type: Object })
  rawPayload!: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'Call', index: true })
  callId?: Types.ObjectId;

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: Number, default: 0 })
  processingTimeMs?: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);
WebhookEventSchema.index({ provider: 1, createdAt: -1 });
