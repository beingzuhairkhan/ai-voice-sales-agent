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
    console.log('========== SEND WHATSAPP START ==========');
    console.log('DTO:', dto);

    try {
      console.log('Validating active call...');
      const call = await this.validateActiveCall(dto.callId);
      console.log('ACTIVE CALL:', call);

      if (!call.leadId) {
        throw new BadRequestException(
          `No leadId associated with call ${call._id}`,
        );
      }
      console.log('Finding lead for callId:', dto.callId);
      const lead = await this.leadsService.getLeadById(
        call.leadId.toString(),
      );

      console.log('FOUND LEAD:', lead);

      if (!lead) {
        console.log('❌ NO LEAD FOUND for callId:', call._id);

        throw new BadRequestException(
          'No lead found for this call — call update_lead first',
        );
      }

      console.log('Lead ID:', lead._id);
      console.log('Phone Number:', call.phoneNumber);
      console.log('Message Content:', dto.messageContent);

      // Idempotency: prevent duplicate HOT WhatsApp
      console.log('Checking if HOT WhatsApp was already sent...');

      const alreadySent = await this.leadsService.hasHotWhatsappBeenSent(
        lead._id,
      );

      console.log('Already sent:', alreadySent);

      if (alreadySent) {
        console.log('⚠️ WhatsApp already sent. Skipping duplicate send.');

        return {
          success: true,
          message: 'WhatsApp already sent for this lead. Not sending again.',
        };
      }

      console.log('Creating WHATSAPP_TRIGGERED action event...');

      await this.actionEventModel.create({
        type: 'WHATSAPP_TRIGGERED',
        callId: call._id,
        leadId: lead._id,
        data: {
          trigger: 'VOICE_TOOL',
          messageLength: dto.messageContent.length,
        },
        success: true,
      });

      console.log('WHATSAPP_TRIGGERED event created.');

      try {
        console.log('Sending WhatsApp message...');
        console.log('To:', call.phoneNumber);
        console.log('Message:', dto.messageContent);

        const whatsappMsg = await this.whatsappService.sendTextMessage(
          call.phoneNumber,
          dto.messageContent,
          {
            leadId: lead._id,
            triggerAction: 'HOT_MID_CALL',
          },
        );

        console.log('✅ WhatsApp API response:', whatsappMsg);

        console.log('Marking HOT WhatsApp as sent...');
        await this.leadsService.markHotWhatsappSent(lead._id);
        console.log('HOT WhatsApp marked as sent.');

        console.log('Creating WHATSAPP_SENT action event...');

        await this.actionEventModel.create({
          type: 'WHATSAPP_SENT',
          callId: call._id,
          leadId: lead._id,
          data: {
            trigger: 'VOICE_TOOL',
            messageId: whatsappMsg._id?.toString(),
          },
          success: true,
        });

        console.log('WHATSAPP_SENT event created.');

        const messageId = whatsappMsg._id?.toString();

        console.log('✅ WhatsApp message sent successfully.');
        console.log('Message ID:', messageId);
        console.log('========== SEND WHATSAPP END ==========');

        return {
          success: true,
          message: 'WhatsApp message sent successfully during the call.',
          messageId,
        };
      } catch (err) {
        console.error('❌ WhatsApp send failed:', err);

        await this.actionEventModel.create({
          type: 'WHATSAPP_FAILED',
          callId: call._id,
          leadId: lead._id,
          data: {
            error: (err as Error).message,
            trigger: 'VOICE_TOOL',
          },
          success: false,
        });

        console.log('WHATSAPP_FAILED event created.');
        console.log('========== SEND WHATSAPP END (FAILED) ==========');

        return {
          success: false,
          message: `WhatsApp send failed: ${(err as Error).message}`,
        };
      }
    } catch (err) {
      console.error('❌ SEND WHATSAPP ERROR:', err);
      console.log('========== SEND WHATSAPP END (ERROR) ==========');
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
      .findOne({ vapiCallId: callId })
      .exec();

    console.log("voice service validateActiveCall", call)
    if (!call) throw new NotFoundException(`Call ${callId} not found`);
    if (call.status === 'ended' || call.status === 'failed' || call.status === 'cancelled') {
      throw new BadRequestException(`Call ${callId} is not active (status: ${call.status})`);
    }
    return call;
  }
}
