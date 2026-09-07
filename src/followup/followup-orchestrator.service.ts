import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Call } from '../calls/call.schema';
import { Lead } from '../leads/lead.schema';
import { ActionEvent } from '../common/types/action-event.schema';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { FollowupService as FollowupGenerationService } from '../ai/followup-generation.service';
import { ConversationsService } from '../conversations/conversations.service';
import { LeadExtractionService } from '../ai/lead-extraction.service';

@Injectable()
export class FollowupOrchestratorService {
  private readonly logger = new Logger(FollowupOrchestratorService.name);

  constructor(
    @InjectModel(Call.name) private callModel: Model<Call>,
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    @InjectModel(ActionEvent.name) private actionEventModel: Model<ActionEvent>,
    private whatsappService: WhatsAppService,
    private followupGen: FollowupGenerationService,
    private conversationsService: ConversationsService,
    private extractionService: LeadExtractionService,
  ) {}

  async processCompletedCall(callId: Types.ObjectId | string): Promise<{
    success: boolean;
    messageSent: boolean;
    error?: string;
  }> {
    const callObjectId = typeof callId === 'string' ? new Types.ObjectId(callId) : callId;

    this.logger.log({ callId: callObjectId.toString() }, 'Processing post-call follow-up');

    const call = await this.callModel.findById(callObjectId).exec();
    if (!call) {
      return { success: false, messageSent: false, error: 'Call not found' };
    }

    // Get or create lead
    let lead: any = await this.leadModel.findOne({ callId: callObjectId }).exec();
    if (!lead) {
      // Extract lead info from conversation
      const extraction = await this.extractionService.extractFromConversation(callObjectId);
      lead = new this.leadModel({
        callId: callObjectId,
        phoneNumber: call.phoneNumber,
        temperature: 'UNKNOWN',
        intentScore: 0,
        confidence: 0,
        ...extraction,
      });
      await lead.save();
    }

    // Get transcript
    let transcript = call.transcript || '';
    if (!transcript) {
      transcript = await this.conversationsService.getTranscriptText(callObjectId);
    }

    // Generate personalized follow-up
    const followupMessage = await this.followupGen.generateFollowup({
      transcript,
      extractedData: {
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
        language: lead.language || 'unknown',
      },
      temperature: lead.temperature,
    });

    // Record FOLLOWUP_GENERATED action
    await this.actionEventModel.create({
      type: 'FOLLOWUP_GENERATED',
      callId: callObjectId,
      leadId: lead._id,
      data: { messageLength: followupMessage.length },
      success: true,
    });

    // Send WhatsApp with attachments
    try {
      const result = await this.whatsappService.sendFollowupWithAttachments(
        call.phoneNumber,
        followupMessage,
        { leadId: lead._id, triggerAction: 'POST_CALL_FOLLOWUP' },
      );

      await this.actionEventModel.create({
        type: 'FOLLOWUP_SENT',
        callId: callObjectId,
        leadId: lead._id,
        data: {
          textMessageId: result.textMessage._id?.toString(),
          attachmentCount: result.attachments.length,
        },
        success: true,
      });

      return { success: true, messageSent: true };
    } catch (err) {
      const errorMsg = (err as Error).message;
      await this.actionEventModel.create({
        type: 'WHATSAPP_FAILED',
        callId: callObjectId,
        leadId: lead._id,
        data: { error: errorMsg, phase: 'post-call-followup' },
        success: false,
      });
      this.logger.error({ err: errorMsg, callId: callObjectId.toString() }, 'Post-call WhatsApp follow-up failed');
      return { success: false, messageSent: false, error: errorMsg };
    }
  }
}
