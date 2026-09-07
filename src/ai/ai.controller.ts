import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { LeadExtractionService } from './lead-extraction.service';
import { QualificationService } from '../qualification/qualification.service';
import { FollowupService } from './followup-generation.service';
import { Inject } from '@nestjs/common';
import { LLM_PROVIDER, LlmProvider } from './llm-provider.interface';

class ExtractLeadDto {
  @IsString() transcript!: string;
}

class ClassifyLeadDto {
  @IsOptional() @IsString() name?: string | null;
  @IsOptional() @IsString() productDescription?: string | null;
  @IsOptional() @IsNumber() productCount?: number | null;
  @IsOptional() @IsNumber() budget?: number | null;
  @IsOptional() @IsString() currency?: string | null;
  @IsOptional() @IsString() timeline?: string | null;
  @IsOptional() @IsArray() requiredFeatures?: string[];
  @IsOptional() @IsArray() painPoints?: string[];
  @IsOptional() @IsBoolean() isDecisionMaker?: boolean | null;
  @IsOptional() @IsArray() barriers?: string[];
  @IsOptional() @IsArray() objections?: string[];
  @IsOptional() @IsArray() buyingSignals?: string[];
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() transcript?: string;
}

class GenerateFollowupDto {
  @IsString() transcript!: string;
  @IsOptional() @IsString() name?: string | null;
  @IsOptional() @IsString() productDescription?: string | null;
  @IsOptional() @IsNumber() budget?: number | null;
  @IsOptional() @IsString() currency?: string | null;
  @IsOptional() @IsString() timeline?: string | null;
  @IsOptional() @IsArray() requiredFeatures?: string[];
  @IsOptional() @IsArray() painPoints?: string[];
  @IsOptional() @IsArray() barriers?: string[];
  @IsOptional() @IsBoolean() isDecisionMaker?: boolean | null;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() temperature?: string;
}

@ApiTags('AI (Admin Testing)')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    private extractionService: LeadExtractionService,
    private qualificationService: QualificationService,
    private followupService: FollowupService,
    @Inject(LLM_PROVIDER) private llmProvider: LlmProvider,
  ) {}

  @Post('extract-lead')
  @ApiOperation({ summary: 'Extract lead data from a transcript (admin testing)' })
  async extractLead(@Body() dto: ExtractLeadDto) {
    return this.extractionService.extractFromTranscript(dto.transcript);
  }

  @Post('classify-lead')
  @ApiOperation({ summary: 'Classify a lead as HOT/WARM/COLD (admin testing)' })
  async classifyLead(@Body() dto: ClassifyLeadDto) {
    return this.qualificationService.qualify({
      extractedData: {
        name: dto.name || null,
        productDescription: dto.productDescription || null,
        productCount: dto.productCount || null,
        budget: dto.budget || null,
        currency: dto.currency || null,
        timeline: dto.timeline || null,
        requiredFeatures: dto.requiredFeatures || [],
        painPoints: dto.painPoints || [],
        isDecisionMaker: dto.isDecisionMaker ?? null,
        barriers: dto.barriers || [],
        objections: dto.objections || [],
        buyingSignals: dto.buyingSignals || [],
        language: dto.language || 'unknown',
      },
      transcript: dto.transcript,
    });
  }

  @Post('generate-followup')
  @ApiOperation({ summary: 'Generate a follow-up message (admin testing)' })
  async generateFollowup(@Body() dto: GenerateFollowupDto) {
    const message = await this.followupService.generateFollowup({
      transcript: dto.transcript,
      extractedData: {
        name: dto.name || null,
        productDescription: dto.productDescription || null,
        productCount: null,
        budget: dto.budget || null,
        currency: dto.currency || null,
        timeline: dto.timeline || null,
        requiredFeatures: dto.requiredFeatures || [],
        painPoints: dto.painPoints || [],
        isDecisionMaker: dto.isDecisionMaker ?? null,
        barriers: dto.barriers || [],
        objections: [],
        buyingSignals: [],
        language: dto.language || 'en',
      },
      temperature: dto.temperature || 'WARM',
    });
    return { message };
  }
}
