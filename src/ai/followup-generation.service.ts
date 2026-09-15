import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LLM_PROVIDER } from './llm-provider.interface';
import { FOLLOWUP_GENERATION_PROMPT } from './prompts/followup-generation.prompt';
import { ExtractedLeadData } from './lead-extraction.service';

export interface FollowupGenerationParams {
  transcript: string;
  extractedData?: ExtractedLeadData;
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

  private readonly resumeUrl =
    "https://drive.google.com/file/d/1rEZr_JxMN_yIG9MDYelJKn_hO9XWkYIl/view";

  private readonly systemOverviewUrl =
    "https://drive.google.com/file/d/1rEZr_JxMN_yIG9MDYelJKn_hO9XWkYIl/view";


  async generateFollowup(params: FollowupGenerationParams): Promise<string> {
    const { transcript, extractedData, temperature } = params;

    const leadSummary = JSON.stringify({
      name: extractedData?.name,
      productDescription: extractedData?.productDescription,
      productCount: extractedData?.productCount,
      budget: extractedData?.budget,
      currency: extractedData?.currency,
      timeline: extractedData?.timeline,
      requiredFeatures: extractedData?.requiredFeatures,
      painPoints: extractedData?.painPoints,
      barriers: extractedData?.barriers,
      isDecisionMaker: extractedData?.isDecisionMaker,
      temperature,
      language: extractedData?.language,
    }, null, 2);

    const userContent = `
Developer mobile: ${this.developerMobile}

Resume URL:
${this.resumeUrl}

System overview URL:
${this.systemOverviewUrl}

Lead information:
${leadSummary}

Conversation transcript:
${transcript}

Extract the WhatsApp template parameters according to the system instructions.

Return ONLY valid JSON.
`;


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

      console.log('Generated follow-up message:', finalMessage);

      return finalMessage;
    } catch (err) {
      this.logger.error({ err: (err as Error).message }, 'Followup generation failed, using fallback');
      return this.fallbackMessage(extractedData);
    }
  }

  private fallbackMessage(extractedData?: ExtractedLeadData): string {
    const data = extractedData || ({} as ExtractedLeadData);

    const businessName = data.name || data.productDescription || "your business";
    const productCount = data.productCount || "the required";
    const budget = data.budget || "to be discussed";
    const timeline = data.timeline || "to be discussed";

    const rawFeatures = data.requiredFeatures as any;
    const requiredFeatures = (rawFeatures && typeof rawFeatures === 'string' && rawFeatures.trim().length > 0)
      ? rawFeatures
      : (Array.isArray(rawFeatures) && rawFeatures.length > 0)
        ? rawFeatures.join(', ')
        : "the required features";

    // Returns valid JSON matching the 8 template variables required by your prompt
    console.log('Fallback follow-up message:');
    return JSON.stringify({
      businessName,
      productCount,
      budget,
      timeline,
      requiredFeatures,
      developerMobile: this.developerMobile,
      resumeUrl: this.resumeUrl,
      systemOverviewUrl: this.systemOverviewUrl,
    }, null, 2);
  }
}
