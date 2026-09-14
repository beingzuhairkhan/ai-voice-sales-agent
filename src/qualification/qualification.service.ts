import {Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider ,LLM_PROVIDER } from '../ai/llm-provider.interface';
import { LEAD_CLASSIFICATION_PROMPT } from '../ai/prompts/lead-classification.prompt';
import { ExtractedLeadData } from '../ai/lead-extraction.service';
import { LeadTemperature } from '../leads/lead.schema';

export interface QualificationInput {
  extractedData: ExtractedLeadData;
  transcript?: string;
}

export interface QualificationResult {
  temperature: LeadTemperature;
  intentScore: number;
  confidence: number;
  evidence: string[];
  reasoning: string;
  aiSuggestion: {
    temperature: LeadTemperature;
    intentScore: number;
    confidence: number;
    evidence: string[];
    reasoning: string;
  };
}

const CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    temperature: { type: 'string', enum: ['HOT', 'WARM', 'COLD'] },
    intentScore: { type: 'number', minimum: 0, maximum: 100 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    evidence: { type: 'array', items: { type: 'string' } },
    reasoning: { type: 'string' },
  },
  required: ['temperature', 'intentScore', 'confidence', 'evidence', 'reasoning'],
};

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);
  private readonly hotThreshold: number;
  private readonly warmThreshold: number;

  constructor(
    @Inject(LLM_PROVIDER)
    private llmProvider: LlmProvider,
    private config: ConfigService,
  ) {
    this.hotThreshold = this.config.get<number>('HOT_SCORE_THRESHOLD', 75);
    this.warmThreshold = this.config.get<number>('WARM_SCORE_THRESHOLD', 45);
  }

  async qualify(input: QualificationInput): Promise<QualificationResult> {
    const aiResult = await this.getAiClassification(input);
    const finalTemperature = this.applyDeterministicRules(aiResult, input.extractedData);

    return {
      temperature: finalTemperature,
      intentScore: aiResult.intentScore,
      confidence: aiResult.confidence,
      evidence: aiResult.evidence,
      reasoning: aiResult.reasoning,
      aiSuggestion: {
        temperature: aiResult.temperature,
        intentScore: aiResult.intentScore,
        confidence: aiResult.confidence,
        evidence: aiResult.evidence,
        reasoning: aiResult.reasoning,
      },
    };
  }

  private async getAiClassification(input: QualificationInput): Promise<{
    temperature: LeadTemperature;
    intentScore: number;
    confidence: number;
    evidence: string[];
    reasoning: string;
  }> {
    try {
      console.log("extracted data before passing to ai " , input.extractedData , input.transcript) ;
      const userContent = JSON.stringify({
        extractedLead: input.extractedData,
        transcript: input.transcript || 'not provided',
      });
      const result = await this.llmProvider.structuredExtraction({
        messages: [
          { role: 'system', content: LEAD_CLASSIFICATION_PROMPT },
          { role: 'user', content: userContent },
        ],
        schema: CLASSIFICATION_SCHEMA,
        temperature: 0.2,
      });

      console.log("AI classification result: ", result);

      const temperature = (result.temperature as LeadTemperature) || 'COLD';
      const intentScore = Math.max(0, Math.min(100, Math.round(Number(result.intentScore) || 0)));
      const confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0));
      const evidence = Array.isArray(result.evidence) ? result.evidence : [];
      const reasoning = typeof result.reasoning === 'string' ? result.reasoning : '';

      return { temperature, intentScore, confidence, evidence, reasoning };
    } catch (err) {
      this.logger.error({ err: (err as Error).message }, 'AI classification failed, using deterministic fallback');
      return this.deterministicFallback(input.extractedData);
    }
  }

  /**
   * Deterministic business rules — the final word on qualification.
   * AI provides a suggestion, but thresholds are enforced by the backend.
   */
  applyDeterministicRules(
    aiResult: { temperature: LeadTemperature; intentScore: number; confidence: number },
    extractedData: ExtractedLeadData,
  ): LeadTemperature {
    const score = aiResult.intentScore;

    // If there are no buying signals and no requirement, force COLD regardless of AI
    if (
      extractedData.buyingSignals.length === 0 &&
      !extractedData.productDescription &&
      !extractedData.timeline &&
      !extractedData.budget
    ) {
      return 'COLD';
    }

    if (score >= this.hotThreshold) return 'HOT';
    if (score >= this.warmThreshold) return 'WARM';
    return 'COLD';
  }

  private deterministicFallback(data: ExtractedLeadData): {
    temperature: LeadTemperature;
    intentScore: number;
    confidence: number;
    evidence: string[];
    reasoning: string;
  } {
    let score = 20;
    const evidence: string[] = [];

    if (data.buyingSignals.length > 0) {
      score += 15 * data.buyingSignals.length;
      evidence.push(...data.buyingSignals);
    }
    if (data.budget) {
      score += 15;
      evidence.push(`Budget mentioned: ${data.budget} ${data.currency || ''}`);
    }
    if (data.timeline) {
      score += 10;
      evidence.push(`Timeline: ${data.timeline}`);
    }
    if (data.productDescription) {
      score += 10;
      evidence.push(`Products: ${data.productDescription}`);
    }
    if (data.isDecisionMaker === true) {
      score += 10;
      evidence.push('Is decision maker');
    }
    if (data.barriers.length > 0) {
      score -= 10;
      evidence.push(`Barriers: ${data.barriers.join(', ')}`);
    }
    if (data.objections.length > 0) {
      score -= 5;
      evidence.push(`Objections: ${data.objections.join(', ')}`);
    }

    score = Math.max(0, Math.min(100, score));
    const temperature: LeadTemperature = score >= this.hotThreshold ? 'HOT' : score >= this.warmThreshold ? 'WARM' : 'COLD';

    return {
      temperature,
      intentScore: score,
      confidence: 0.5,
      evidence,
      reasoning: 'Deterministic fallback: score based on extracted signals and barriers.',
    };
  }
}
