import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AgentConfigurationDocument = AgentConfiguration & Document;

@Schema({ timestamps: true, collection: 'agent_configurations' })
export class AgentConfiguration {
  _id!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ type: String })
  vapiAssistantId?: string;

  @Prop({ type: Object, default: {} })
  modelConfig!: Record<string, any>;

  @Prop({ type: Object, default: {} })
  voiceConfig!: Record<string, any>;

  @Prop({ type: [String], default: ['te-IN', 'hi-IN', 'en-IN'] })
  supportedLanguages!: string[];

  @Prop({ type: Object, default: {} })
  toolConfig!: Record<string, any>;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Number, default: 1 })
  version!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AgentConfigurationSchema = SchemaFactory.createForClass(AgentConfiguration);
