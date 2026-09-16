import { Module } from '@nestjs/common';
import { SarvamProvider } from './sarvam-provider';

@Module({
  providers: [SarvamProvider],
  exports: [SarvamProvider],
})
export class SarvamModule {}
