import { Module } from '@nestjs/common';
import { VapiProvider } from './vapi-provider';

@Module({
  providers: [VapiProvider],
  exports: [VapiProvider],
})
export class VapiModule {}
