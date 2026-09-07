import { Module , forwardRef  } from '@nestjs/common';
import { QualificationService } from './qualification.service';
import { AiModule } from '../ai/ai.module';

@Module({
   imports: [
    forwardRef(() => AiModule),
  ],
  providers: [QualificationService],
  exports: [QualificationService],
})
export class QualificationModule {}
