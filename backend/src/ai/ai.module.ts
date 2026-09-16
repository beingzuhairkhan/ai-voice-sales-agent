import { Module ,forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OpenAiProvider } from './openai-provider';
import { LeadExtractionService } from './lead-extraction.service';
import { FollowupService as FollowupGenerationService } from './followup-generation.service';
import { AgentConfiguration, AgentConfigurationSchema } from './agent-configuration.schema';
import { LLM_PROVIDER } from './llm-provider.interface';
import { ConversationsModule } from '../conversations/conversations.module';
import { AiController } from './ai.controller';
import { QualificationModule } from '../qualification/qualification.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentConfiguration.name, schema: AgentConfigurationSchema },
    ]),
    ConversationsModule,
    forwardRef(() => QualificationModule),
  ],
  providers: [
    { provide: LLM_PROVIDER, useClass: OpenAiProvider },
    LeadExtractionService,
    FollowupGenerationService,
  ],
  controllers: [AiController],
  exports: [
    LLM_PROVIDER,
    LeadExtractionService,
    FollowupGenerationService,
  ],
})
export class AiModule {}
