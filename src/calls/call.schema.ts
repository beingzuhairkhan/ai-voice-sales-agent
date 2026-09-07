import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'in-progress'
  | 'ended'
  | 'failed'
  | 'no-answer'
  | 'busy'
  | 'cancelled'
  | 'queued';

export type CallDocument = Call & Document;

@Schema({ timestamps: true, collection: 'calls' })
export class Call {
  _id!: Types.ObjectId;

  @Prop({ index: true, unique: true, sparse: true })
  vapiCallId?: string;

  @Prop({ required: true, index: true })
  phoneNumber!: string;

  @Prop({ required: true, enum: ['initiated', 'ringing', 'in-progress', 'ended', 'failed', 'no-answer', 'busy', 'cancelled' , 'queued'], default: 'initiated' })
  status!: CallStatus;

  @Prop({ type: Date })
  startTime?: Date;

  @Prop({ type: Date })
  endTime?: Date;

  @Prop({ type: Number })
  duration?: number;

  @Prop({ default: 'unknown' })
  language?: string;

  @Prop({ type: String })
  transcript?: string;

  @Prop({ type: String })
  summary?: string;

  @Prop({ type: String })
  recordingUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Lead', index: true })
  leadId?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, any>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const CallSchema = SchemaFactory.createForClass(Call);
CallSchema.index({ phoneNumber: 1, createdAt: -1 });
