import { Inject , Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LlmProvider , LLM_PROVIDER  } from './llm-provider.interface';
import { LEAD_EXTRACTION_PROMPT } from './prompts/lead-extraction.prompt';
import { Lead } from '../leads/lead.schema';
import { ConversationMessage } from '../conversations/conversation-message.schema';

export interface ExtractedLeadData {
  name: string | null;
  productDescription: string | null;
  productCount: number | null;
  budget: number | null;
  currency: string | null;
  timeline: string | null;
  requiredFeatures: string[];
  painPoints: string[];
  isDecisionMaker: boolean | null;
  barriers: string[];
  objections: string[];
  buyingSignals: string[];
  language: string;
}

const EMPTY_EXTRACTION: ExtractedLeadData = {
  name: null,
  productDescription: null,
  productCount: null,
  budget: null,
  currency: null,
  timeline: null,
  requiredFeatures: [],
  painPoints: [],
  isDecisionMaker: null,
  barriers: [],
  objections: [],
  buyingSignals: [],
  language: 'unknown',
};

export const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: ['string', 'null'] },
    productDescription: { type: ['string', 'null'] },
    productCount: { type: ['number', 'null'] },
    budget: { type: ['number', 'null'] },
    currency: { type: ['string', 'null'] },
    timeline: { type: ['string', 'null'] },
    requiredFeatures: { type: 'array', items: { type: 'string' } },
    painPoints: { type: 'array', items: { type: 'string' } },
    isDecisionMaker: { type: ['boolean', 'null'] },
    barriers: { type: 'array', items: { type: 'string' } },
    objections: { type: 'array', items: { type: 'string' } },
    buyingSignals: { type: 'array', items: { type: 'string' } },
    language: { type: 'string' },
  },
  required: [
    'name',
    'productDescription',
    'productCount',
    'budget',
    'currency',
    'timeline',
    'requiredFeatures',
    'painPoints',
    'isDecisionMaker',
    'barriers',
    'objections',
    'buyingSignals',
    'language',
  ],
};

@Injectable()
export class LeadExtractionService {
  private readonly logger = new Logger(LeadExtractionService.name);

  constructor(
    @Inject(LLM_PROVIDER)
    private llmProvider: LlmProvider,
    private config: ConfigService,
    @InjectModel(ConversationMessage.name) private conversationModel: Model<ConversationMessage>,
  ) {}

  async extractFromConversation(callId: Types.ObjectId | string): Promise<ExtractedLeadData> {
    const messages = await this.conversationModel
      .find({ callId: typeof callId === 'string' ? new Types.ObjectId(callId) : callId })
      .sort({ timestamp: 1 })
      .exec();

    if (messages.length === 0) {
      this.logger.warn({ callId: callId.toString() }, 'No conversation messages found for extraction');
      return { ...EMPTY_EXTRACTION };
    }
    console.log("extractFromConversation",messages)

    const transcript = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.message}`)
      .join('\n');

    return this.extractFromTranscript(transcript);
  }

  async extractFromTranscript(transcript: string): Promise<ExtractedLeadData> {
    if (!transcript || transcript.trim().length === 0) {
      return { ...EMPTY_EXTRACTION };
    }

    try {
      const result = await this.llmProvider.structuredExtraction({
        messages: [
          { role: 'system', content: LEAD_EXTRACTION_PROMPT },
          { role: 'user', content: `Conversation transcript:\n\n${transcript}` },
        ],
        schema: EXTRACTION_SCHEMA,
        temperature: 0.1,
      });
      console.log("result" , result)

      return this.validateExtraction(result);
    } catch (err) {
      this.logger.error({ err: (err as Error).message }, 'Lead extraction failed');
      return { ...EMPTY_EXTRACTION };
    }
  }

  validateExtraction(raw: Record<string, any>): ExtractedLeadData {
    return {
      name: typeof raw.name === 'string' ? raw.name : null,
      productDescription: typeof raw.productDescription === 'string' ? raw.productDescription : null,
      productCount: typeof raw.productCount === 'number' ? raw.productCount : null,
      budget: typeof raw.budget === 'number' ? raw.budget : null,
      currency: typeof raw.currency === 'string' ? raw.currency : null,
      timeline: typeof raw.timeline === 'string' ? raw.timeline : null,
      requiredFeatures: Array.isArray(raw.requiredFeatures) ? raw.requiredFeatures.filter((x: any) => typeof x === 'string') : [],
      painPoints: Array.isArray(raw.painPoints) ? raw.painPoints.filter((x: any) => typeof x === 'string') : [],
      isDecisionMaker: typeof raw.isDecisionMaker === 'boolean' ? raw.isDecisionMaker : null,
      barriers: Array.isArray(raw.barriers) ? raw.barriers.filter((x: any) => typeof x === 'string') : [],
      objections: Array.isArray(raw.objections) ? raw.objections.filter((x: any) => typeof x === 'string') : [],
      buyingSignals: Array.isArray(raw.buyingSignals) ? raw.buyingSignals.filter((x: any) => typeof x === 'string') : [],
      language: typeof raw.language === 'string' ? raw.language : 'unknown',
    };
  }
}
