import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Call } from '../calls/call.schema';
import { Lead } from '../leads/lead.schema';
import { ActionEvent } from '../common/types/action-event.schema';
import { LeadsService } from '../leads/leads.service';
import { ConversationsService } from '../conversations/conversations.service';
import { LeadExtractionService } from '../ai/lead-extraction.service';
import { QualificationService } from '../qualification/qualification.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { FollowupService as FollowupGenerationService } from '../ai/followup-generation.service';
import { CallbackService } from '../callback/callback.service';
import { VapiProvider } from '../vapi/vapi-provider';
import { UpdateLeadDto, SendWhatsappDto, BookCallbackDto, GetLeadContextDto, EndCallDto } from './dto/voice-tool.dto';

@Injectable()
export class VoiceToolsService {
  private readonly logger = new Logger(VoiceToolsService.name);

  constructor(
    @InjectModel(Call.name) private callModel: Model<Call>,
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    @InjectModel(ActionEvent.name) private actionEventModel: Model<ActionEvent>,
    private leadsService: LeadsService,
    private conversationsService: ConversationsService,
    private extractionService: LeadExtractionService,
    private qualificationService: QualificationService,
    private whatsappService: WhatsAppService,
    private followupGen: FollowupGenerationService,
    private callbackService: CallbackService,
    private vapiProvider: VapiProvider,
    private config: ConfigService,
  ) { }

  async updateLead(dto: UpdateLeadDto): Promise<{ success: boolean; leadId: string; message: string }> {
    const call = await this.validateActiveCall(dto.callId);

    // Find or create lead
    let lead: any = await this.leadsService.getLeadByCallId(dto.callId);
    if (!lead) {
      lead = new this.leadModel({
        callId: call._id,
        phoneNumber: call.phoneNumber,
        temperature: 'UNKNOWN',
        intentScore: 0,
        confidence: 0,
      });
      await lead.save();
      await this.callModel.findByIdAndUpdate(call._id, { leadId: lead._id }).exec();
    }

    // Update fields — only non-null/non-empty values
    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name || lead.name;
    if (dto.productDescription !== undefined) updateData.productDescription = dto.productDescription || lead.productDescription;
    if (dto.productCount !== undefined) updateData.productCount = dto.productCount;
    if (dto.budget !== undefined) updateData.budget = dto.budget;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.timeline !== undefined) updateData.timeline = dto.timeline;
    if (dto.isDecisionMaker !== undefined) updateData.isDecisionMaker = dto.isDecisionMaker;
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.requiredFeatures) updateData.requiredFeatures = [...new Set([...lead.requiredFeatures, ...dto.requiredFeatures])];
    if (dto.painPoints) updateData.painPoints = [...new Set([...lead.painPoints, ...dto.painPoints])];
    if (dto.barriers) updateData.barriers = [...new Set([...lead.barriers, ...dto.barriers])];
    if (dto.objections) updateData.objections = [...new Set([...lead.objections, ...dto.objections])];
    if (dto.buyingSignals) updateData.buyingSignals = [...new Set([...lead.buyingSignals, ...dto.buyingSignals])];

    Object.assign(lead, updateData);
    await lead.save();

    await this.actionEventModel.create({
      type: 'LEAD_EXTRACTED',
      callId: call._id,
      leadId: lead._id,
      data: updateData,
      success: true,
    });

    return {
      success: true,
      leadId: lead._id.toString(),
      message: 'Lead updated successfully',
    };
  }

  async sendWhatsapp(
    dto: any,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      console.log("sendWhatsapp called with dto:", dto);
      const call = await this.validateActiveCall(dto.callId);
      const messageContent = dto.messageContent ?? dto.msg;

    if (!messageContent) {
      throw new BadRequestException(
        'WhatsApp message content is required',
      );
    }

      if (!call) {
        throw new BadRequestException(
          `No call found for Vapi call ID: ${dto.callId}`,
        );
      }

      const lead = await this.leadsService.getLeadByCallId(call._id);

      if (!lead) {
        throw new BadRequestException(
          'No lead found for this call — call update_lead first',
        );
      }

      // Check only HOT_MID_CALL WhatsApp
      const alreadySent =
        await this.leadsService.hasHotWhatsappBeenSent(lead._id);

      if (alreadySent) {
        return {
          success: true,
          message: 'Hot mid-call WhatsApp already sent. Skipping duplicate.',
        };
      }

      await this.actionEventModel.create({
        type: 'WHATSAPP_TRIGGERED',
        callId: call._id,
        leadId: lead._id,
        data: {
          trigger: 'VOICE_TOOL',
          whatsappType: 'HOT_MID_CALL',
          messageLength: messageContent.length
        },
        success: true,
      });

      try {

        const whatsappMsg =
          await this.whatsappService.sendTextMessage(
            call.phoneNumber,
            messageContent,
            {
              leadId: lead._id,
              triggerAction: 'HOT_MID_CALL',
            },
            'HOT_MID_CALL',
          );

        // Mark only HOT_MID_CALL as sent
        await this.leadsService.markHotWhatsappSent(lead._id);

        await this.actionEventModel.create({
          type: 'WHATSAPP_SENT',
          callId: call._id,
          leadId: lead._id,
          data: {
            trigger: 'VOICE_TOOL',
            whatsappType: 'HOT_MID_CALL',
            messageId: whatsappMsg._id?.toString(),
          },
          success: true,
        });

        return {
          success: true,
          message: 'Hot mid-call WhatsApp sent successfully.',
          messageId: whatsappMsg._id?.toString(),
        };
      } catch (err) {
        await this.actionEventModel.create({
          type: 'WHATSAPP_FAILED',
          callId: call._id,
          leadId: lead._id,
          data: {
            error: err instanceof Error ? err.message : String(err),
            trigger: 'VOICE_TOOL',
            whatsappType: 'HOT_MID_CALL',
          },
          success: false,
        });

        return {
          success: false,
          message: `WhatsApp send failed: ${err instanceof Error ? err.message : String(err)
            }`,
        };
      }
    } catch (err) {
      throw err;
    }
  }

  async bookCallback(dto: any): Promise<{
    success: boolean;
    clarificationNeeded: boolean;
    confirmationMessage: string;
    callbackId?: string;
  }> {
    try {
      const vapiCallId = dto.message?.call?.id;

      if (!vapiCallId) {
        throw new BadRequestException(
          'Vapi call ID not found in webhook payload',
        );
      }
      const toolCall = dto.message?.toolCalls?.find(
        (tool: any) =>
          tool.function?.name === 'book_callback',
      );

      if (!toolCall) {
        throw new BadRequestException(
          'book_callback tool call not found',
        );
      }

      const args =
        typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;

      const requestedTime = args?.requestedTime;
      const reason = args?.reason;


      if (!requestedTime) {
        return {
          success: false,
          clarificationNeeded: true,
          confirmationMessage:
            'What day and time would you like us to call you back?',
        };
      }

      const call = await this.callModel.findOne({
        vapiCallId,
      });

      if (!call) {
        throw new BadRequestException(
          `No call found for Vapi call ID: ${vapiCallId}`,
        );
      }

      const lead = await this.leadsService.getLeadByCallId(
        call._id,
      );

      await this.actionEventModel.create({
        type: 'CALLBACK_REQUESTED',
        callId: call._id,
        leadId: lead?._id,
        data: {
          requestedTime,
          reason,
        },
        success: true,
      });

      const result =
        await this.callbackService.requestCallback({
          leadId: lead?._id,
          callId: call._id,
          requestedTimePhrase: requestedTime,
          reason,
        });

      if (
        !result.clarificationNeeded &&
        result.callback
      ) {
        await this.actionEventModel.create({
          type: 'CALLBACK_BOOKED',
          callId: call._id,
          leadId: lead?._id,
          data: {
            callbackId:
              result.callback._id?.toString(),
            dateTime:
              result.callback.parsedDateTime,
          },
          success: true,
        });
      }

      const response = {
        success: !result.clarificationNeeded,
        clarificationNeeded:
          result.clarificationNeeded,
        confirmationMessage:
          result.confirmationMessage,
        callbackId:
          result.callback?._id?.toString(),
      };


      return response;
    } catch (error) {
      throw error;
    }
  }


  async getLeadContext(dto: GetLeadContextDto): Promise<{
    leadId: string;
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
    temperature: string;
    intentScore: number;
    hotWhatsappSent: boolean;
    language: string;
  }> {
    await this.validateActiveCall(dto.callId);
    const lead = await this.leadsService.getLeadByCallId(dto.callId);
    if (!lead) throw new NotFoundException('No lead context found for this call');

    return {
      leadId: lead._id.toString(),
      name: lead.name ?? null,
      productDescription: lead.productDescription ?? null,
      productCount: lead.productCount ?? null,
      budget: lead.budget ?? null,
      currency: lead.currency ?? null,
      timeline: lead.timeline ?? null,
      requiredFeatures: lead.requiredFeatures,
      painPoints: lead.painPoints,
      isDecisionMaker: lead.isDecisionMaker ?? null,
      barriers: lead.barriers,
      objections: lead.objections,
      buyingSignals: lead.buyingSignals,
      temperature: lead.temperature,
      intentScore: lead.intentScore,
      hotWhatsappSent: lead.hotWhatsappSent,
      language: lead.language,
    };
  }

  async endCall(dto: EndCallDto): Promise<{ success: boolean; message: string }> {
    const call = await this.validateActiveCall(dto.callId);

    // End call in Vapi
    if (call.vapiCallId) {
      try {
        await this.vapiProvider.endCall(call.vapiCallId);
      } catch (err) {
        this.logger.warn({ err: (err as Error).message }, 'Failed to end call in Vapi, proceeding with local end');
      }
    }

    // End call locally
    await this.callModel.findByIdAndUpdate(call._id, {
      status: 'ended',
      endTime: new Date(),
    }).exec();

    await this.actionEventModel.create({
      type: 'CALL_ENDED',
      callId: call._id,
      data: { summary: dto.summary, trigger: 'VOICE_TOOL' },
      success: true,
    });

    return { success: true, message: 'Call ended successfully' };
  }

  private async validateActiveCall(callId: string): Promise<Call> {
    // if (!Types.ObjectId.isValid(callId)) {
    //   throw new BadRequestException('Invalid call ID format');
    // }
    const call = await this.callModel
      .findOne({
        $or: [
          { _id: new Types.ObjectId(callId) },
          { vapiCallId: callId },
        ],
      })
      .exec();

    if (!call) throw new NotFoundException(`Call ${callId} not found`);
    if (call.status === 'ended' || call.status === 'failed' || call.status === 'cancelled') {
      throw new BadRequestException(`Call ${callId} is not active (status: ${call.status})`);
    }
    return call;
  }
}
