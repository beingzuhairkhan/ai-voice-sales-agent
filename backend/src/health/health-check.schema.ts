import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'health_checks' })
export class HealthCheck extends Document {
  @Prop({ type: String })
  service?: string;

  @Prop({ type: String })
  status?: string;

  @Prop({ type: Date, default: Date.now })
  checkedAt?: Date;
}

export const HealthCheckSchema = SchemaFactory.createForClass(HealthCheck);
