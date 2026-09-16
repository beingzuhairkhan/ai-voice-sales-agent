import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD' | 'UNKNOWN';

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true, collection: 'leads' })
export class Lead {
  _id!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Call', index: true })
  callId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  phoneNumber!: string;

  @Prop({ type: String, default: null })
  name?: string | null;

  @Prop({ enum: ['HOT', 'WARM', 'COLD', 'UNKNOWN'], default: 'UNKNOWN', index: true })
  temperature!: LeadTemperature;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  intentScore!: number;

  @Prop({ type: Number, default: 0, min: 0, max: 1 })
  confidence!: number;

  @Prop({ type: Number, default: null })
  budget?: number | null;

  @Prop({ type: String, default: null })
  currency?: string | null;

  @Prop({ type: String, default: null })
  productDescription?: string | null;

  @Prop({ type: Number, default: null })
  productCount?: number | null;

  @Prop({ type: String, default: null })
  timeline?: string | null;

  @Prop({ type: [String], default: [] })
  requiredFeatures!: string[];

  @Prop({ type: [String], default: [] })
  painPoints!: string[];

  @Prop({ type: Boolean, default: null })
  isDecisionMaker?: boolean | null;

  @Prop({ type: [String], default: [] })
  barriers!: string[];

  @Prop({ type: [String], default: [] })
  objections!: string[];

  @Prop({ type: [String], default: [] })
  buyingSignals!: string[];

  @Prop({ type: String, default: 'unknown' })
  language!: string;

  @Prop({ type: Object, default: {} })
  rawAiExtraction!: Record<string, any>;

  @Prop({ type: [String], default: [] })
  evidence!: string[];

  @Prop({ type: String, default: null })
  reasoning?: string | null;

  @Prop({ type: Boolean, default: false })
  hotWhatsappSent!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
LeadSchema.index({ temperature: 1, createdAt: -1 });
LeadSchema.index({ phoneNumber: 1 });
