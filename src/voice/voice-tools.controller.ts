import { Body, Controller, Post, UseGuards, Headers, Req, Res, BadRequestException, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VoiceToolsService } from './voice-tools.service';
import { UpdateLeadDto, SendWhatsappDto, BookCallbackDto, GetLeadContextDto, EndCallDto } from './dto/voice-tool.dto';
import { VoiceToolAuthGuard } from '../common/guards/voice-tool-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { SarvamProvider } from '@/sarvam/sarvam-provider';
import type { Response } from 'express';
import { FollowupService as FollowupGenerationService } from '../ai/followup-generation.service';
import { LLM_PROVIDER, LlmProvider } from '@/ai/llm-provider.interface';
import { SUMMARIZE_PROMPT } from '@/ai/prompts/summarize.prompt';

@ApiTags('Voice Tools')
@Controller('voice/tools')
@UseGuards(VoiceToolAuthGuard)
@Public()
export class VoiceToolsController {
  constructor(private voiceToolsService: VoiceToolsService,
    private sarvamTtsService: SarvamProvider,
    private config: ConfigService,
      private followupGen: FollowupGenerationService,
      @Inject(LLM_PROVIDER)
          private llmProvider: LlmProvider,
  ) { }

  @Post('update-lead')
  @ApiOperation({ summary: 'Vapi tool: update lead information during call' })
  async updateLead(@Body() dto: UpdateLeadDto) {
    return this.voiceToolsService.updateLead(dto);
  }

  @Post('send-whatsapp')
  @ApiOperation({
    summary: 'Vapi tool: send WhatsApp message during call (HOT lead only)',
  })
  async sendWhatsapp(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {

    const expectedSecret = this.config.get<string>('VAPI_WEBHOOK_SECRET');

    if (expectedSecret) {
      const authorization = headers['authorization'];
      const expectedAuthorization = `Bearer ${expectedSecret}`;

      if (authorization !== expectedAuthorization) {
        console.log('SEND WHATSAPP: UNAUTHORIZED');
        return { status: 'unauthorized' };
      }
    }

    // Extract your MongoDB IDs from Vapi metadata
    const metadata = body?.message?.call?.metadata || {};

    const callId = metadata.internalCallId;
    const leadId = metadata.leadId;

    // Extract tool arguments
    const toolCall =
      body?.message?.toolCalls?.[0] ||
      body?.message?.toolCallList?.[0];

    const toolArguments =
      toolCall?.function?.arguments ||
      toolCall?.arguments ||
      {};

    // If arguments are a JSON string, parse them
    let args: any = toolArguments;

    if (typeof toolArguments === 'string') {
      try {
        args = JSON.parse(toolArguments);
      } catch {
        args = {};
      }
    }

    const messageContent = args?.messageContent;


    if (!callId) {
      throw new BadRequestException(
        'internalCallId missing from Vapi call metadata',
      );
    }

    if (!leadId) {
      throw new BadRequestException(
        'leadId missing from Vapi call metadata',
      );
    }

    if (!messageContent) {
      throw new BadRequestException(
        'messageContent missing from Vapi tool arguments',
      );
    }

    const msg = await this.llmProvider.summarize(
      messageContent,SUMMARIZE_PROMPT
    )


    const result = await this.voiceToolsService.sendWhatsapp({
      type: 'HOT_MID_CALL',
      callId,
      leadId,
      vapiCallId: body?.message?.call?.id,
      msg,
    });


    return result;
  }

  @Post('book-callback')
  @ApiOperation({ summary: 'Vapi tool: schedule a callback' })
  async bookCallback(@Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const expectedSecret = this.config.get<string>('VAPI_WEBHOOK_SECRET');

    if (expectedSecret) {
      const authorization = headers['authorization'];

      const expectedAuthorization = `Bearer ${expectedSecret}`;

      if (authorization !== expectedAuthorization) {
        req.log?.warn(
          {
            hasAuthorization: !!authorization,
          },
          'Vapi webhook secret mismatch',
        );

        return { status: 'unauthorized' };
      }
    }
    return this.voiceToolsService.bookCallback(body);
  }

  @Post('get-lead-context')
  @ApiOperation({ summary: 'Vapi tool: get current lead context' })
  async getLeadContext(@Body() dto: GetLeadContextDto) {
    return this.voiceToolsService.getLeadContext(dto);
  }

  @Post('end-call')
  @ApiOperation({ summary: 'Vapi tool: end the active call' })
  async endCall(@Body() dto: EndCallDto) {
    return this.voiceToolsService.endCall(dto);
  }

  @Post('sarvam-tts')
  async sarvamTts(
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      const message = body?.message;

      if (!message || message.type !== 'voice-request') {
        return res.status(400).json({
          error: 'Invalid Vapi request',
        });
      }

      const text = message.text;

      if (!text) {
        return res.status(400).json({
          error: 'Missing text',
        });
      }

      const sampleRate = message.sampleRate || 24000;

      const allowedRates = [
        8000,
        16000,
        22050,
        24000,
      ];

      const sarvamSampleRate =
        allowedRates.includes(sampleRate)
          ? sampleRate
          : 24000;

      const result =
        await this.sarvamTtsService.textToSpeech({
          text,
          language: 'hi-IN',
          voice: 'ritu',
          speed: 0.95,
          sampleRate: sarvamSampleRate,
        });

      if (!result.audioBase64) {
        return res.status(500).json({
          error: 'Sarvam returned no audio',
        });
      }

      // Decode Sarvam base64 WAV
      const wavBuffer = Buffer.from(
        result.audioBase64,
        'base64',
      );

      // Remove WAV header
      const pcmBuffer = wavBuffer.subarray(44);

      // Return raw PCM to Vapi
      res.setHeader(
        'Content-Type',
        'audio/pcm',
      );

      res.setHeader(
        'Content-Length',
        pcmBuffer.length,
      );

      return res.send(pcmBuffer);
    } catch (error) {
      console.error('Server error:', error);

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

}
