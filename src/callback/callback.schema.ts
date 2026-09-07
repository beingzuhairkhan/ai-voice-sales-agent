import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallbackStatus = 'requested' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled' | 'failed';

export type CallbackDocument = Callback & Document;

@Schema({ timestamps: true, collection: 'callbacks' })
export class Callback {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Lead', index: true })
  leadId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Call', index: true })
  callId?: Types.ObjectId;

  @Prop({ type: String })
  requestedTimePhrase?: string;

  @Prop({ type: Date, index: true })
  parsedDateTime?: Date;

  @Prop({ type: String, default: 'Asia/Kolkata' })
  timezone!: string;

  @Prop({ type: Number, default: 0, min: 0, max: 1 })
  confidence!: number;

  @Prop({ enum: ['requested', 'confirmed', 'scheduled', 'completed', 'cancelled', 'failed'], default: 'requested' })
  status!: CallbackStatus;

  @Prop({ type: String })
  reason?: string;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: String, index: true, sparse: true })
  googleCalendarEventId?: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export const CallbackSchema = SchemaFactory.createForClass(Callback);
