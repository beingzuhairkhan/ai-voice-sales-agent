import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActionType =
  | 'CALL_STARTED'
  | 'CALL_ENDED'
  | 'HOT_DETECTED'
  | 'LEAD_CLASSIFIED'
  | 'WHATSAPP_TRIGGERED'
  | 'WHATSAPP_SENT'
  | 'WHATSAPP_FAILED'
  | 'CALLBACK_REQUESTED'
  | 'CALLBACK_BOOKED'
  | 'FOLLOWUP_GENERATED'
  | 'FOLLOWUP_SENT'
  | 'LEAD_EXTRACTED'
  | 'ERROR';

export type ActionEventDocument = ActionEvent & Document;

@Schema({ timestamps: true, collection: 'action_events' })
export class ActionEvent {
  _id!: Types.ObjectId;

  @Prop({ required: true, enum: [
    'CALL_STARTED', 'CALL_ENDED', 'HOT_DETECTED', 'LEAD_CLASSIFIED',
    'WHATSAPP_TRIGGERED', 'WHATSAPP_SENT', 'WHATSAPP_FAILED',
    'CALLBACK_REQUESTED', 'CALLBACK_BOOKED', 'FOLLOWUP_GENERATED',
    'FOLLOWUP_SENT', 'LEAD_EXTRACTED', 'ERROR',
  ] })
  type!: ActionType;

  @Prop({ type: Types.ObjectId, ref: 'Call', index: true })
  callId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Lead', index: true })
  leadId?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  data!: Record<string, any>;

  @Prop({ type: String })
  message?: string;

  @Prop({ type: Boolean, default: false })
  success!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ActionEventSchema = SchemaFactory.createForClass(ActionEvent);
ActionEventSchema.index({ callId: 1, createdAt: 1 });
ActionEventSchema.index({ type: 1, createdAt: -1 });
