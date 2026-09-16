import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthCheck, HealthCheckSchema } from './health-check.schema';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HealthCheck.name, schema: HealthCheckSchema }]),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
