import { Body, Controller, Post, UseGuards, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VoiceToolsService } from './voice-tools.service';
import { UpdateLeadDto, SendWhatsappDto, BookCallbackDto, GetLeadContextDto, EndCallDto } from './dto/voice-tool.dto';
import { VoiceToolAuthGuard } from '../common/guards/voice-tool-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
@ApiTags('Voice Tools')
@Controller('voice/tools')
@UseGuards(VoiceToolAuthGuard)
@Public()
export class VoiceToolsController {
  constructor(private voiceToolsService: VoiceToolsService,
    private config: ConfigService,
  ) { }

  @Post('update-lead')
  @ApiOperation({ summary: 'Vapi tool: update lead information during call' })
  async updateLead(@Body() dto: UpdateLeadDto) {
    return this.voiceToolsService.updateLead(dto);
  }

  @Post('send-whatsapp')
  @ApiOperation({ summary: 'Vapi tool: send WhatsApp message during call (HOT lead only)' })
  async sendWhatsapp(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    console.log('SEND WHATSAPP BODY:', body);
    console.log('SEND WHATSAPP HEADERS:', headers);

    const expectedSecret = this.config.get<string>('VAPI_WEBHOOK_SECRET');

    if (expectedSecret) {
      const authorization = headers['authorization'];
      const expectedAuthorization = `Bearer ${expectedSecret}`;

      if (authorization !== expectedAuthorization) {
        console.log('SEND WHATSAPP: UNAUTHORIZED');
        return { status: 'unauthorized' };
      }
    }

    console.log('SEND WHATSAPP: CALLING SERVICE');

    const result = await this.voiceToolsService.sendWhatsapp(body);

    console.log('SEND WHATSAPP RESULT:', result);

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
}
