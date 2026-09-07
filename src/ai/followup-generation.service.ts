import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LLM_PROVIDER } from './llm-provider.interface';
import { FOLLOWUP_GENERATION_PROMPT } from './prompts/followup-generation.prompt';
import { ExtractedLeadData } from './lead-extraction.service';

export interface FollowupGenerationParams {
  transcript: string;
  extractedData: ExtractedLeadData;
  temperature: string;
}

@Injectable()
export class FollowupService {
  private readonly logger = new Logger(FollowupService.name);
  private readonly developerName: string;
  private readonly developerMobile: string;

  constructor(
    @Inject(LLM_PROVIDER)
    private llmProvider: LlmProvider,
    private config: ConfigService,
  ) {
    this.developerName = this.config.get<string>('DEVELOPER_NAME', 'Developer');
    this.developerMobile = this.config.get<string>('DEVELOPER_MOBILE_NUMBER', '');
  }

  async generateFollowup(params: FollowupGenerationParams): Promise<string> {
    const { transcript, extractedData, temperature } = params;

    const leadSummary = JSON.stringify({
      name: extractedData.name,
      productDescription: extractedData.productDescription,
      productCount: extractedData.productCount,
      budget: extractedData.budget,
      currency: extractedData.currency,
      timeline: extractedData.timeline,
      requiredFeatures: extractedData.requiredFeatures,
      painPoints: extractedData.painPoints,
      barriers: extractedData.barriers,
      isDecisionMaker: extractedData.isDecisionMaker,
      temperature,
      language: extractedData.language,
    }, null, 2);

    const userContent = `Developer name: ${this.developerName}
Developer mobile: ${this.developerMobile}

Lead information:
${leadSummary}

Conversation transcript:
${transcript}

Generate a personalized WhatsApp follow-up message referencing the actual conversation above.`;

    try {
      const message = await this.llmProvider.chatCompletion(
        [
          { role: 'system', content: FOLLOWUP_GENERATION_PROMPT },
          { role: 'user', content: userContent },
        ],
        { temperature: 0.7 },
      );

      if (!message || message.trim().length === 0) {
        return this.fallbackMessage(extractedData);
      }

      // Ensure developer contact info is present
      let finalMessage = message.trim();
      if (!finalMessage.includes(this.developerMobile)) {
        finalMessage += `\n\nContact: ${this.developerName} — ${this.developerMobile}`;
      }

      return finalMessage;
    } catch (err) {
      this.logger.error({ err: (err as Error).message }, 'Followup generation failed, using fallback');
      return this.fallbackMessage(extractedData);
    }
  }

  private fallbackMessage(data: ExtractedLeadData): string {
    const greeting = data.name ? `Namaste ${data.name},` : 'Namaste,';
    const products = data.productDescription ? `for your ${data.productDescription} business` : 'for your business';
    const budget = data.budget ? `We can work within your budget of ${data.budget} ${data.currency || 'INR'}.` : '';
    const features = data.requiredFeatures.length > 0 ? `Features you mentioned: ${data.requiredFeatures.join(', ')}.` : '';

    return `${greeting}

Thank you for speaking with me today about your e-commerce website ${products}. ${budget} ${features}

I'd love to help you build this. Please feel free to reach out:
${this.developerName} — ${this.developerMobile}

Looking forward to hearing from you.`;
  }
}
