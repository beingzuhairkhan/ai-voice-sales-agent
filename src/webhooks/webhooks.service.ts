import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WebhookEvent } from './webhook-event.schema';
import { ActionEvent } from '../common/types/action-event.schema';
import { CallsService } from '../calls/calls.service';
import { ConversationsService } from '../conversations/conversations.service';
import { LeadsService } from '../leads/leads.service';
import { LeadExtractionService } from '../ai/lead-extraction.service';
import { QualificationService } from '../qualification/qualification.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { FollowupService as FollowupGenerationService } from '../ai/followup-generation.service';
import { ConfigService } from '@nestjs/config';
import { VapiWebhookEvent } from '../vapi/vapi-provider.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FOLLOWUP_QUEUE } from '@/jobs/jobs.service';

export interface WebhookProcessResult {
  status: 'processed' | 'duplicate' | 'ignored' | 'failed';
  callId?: string;
  message?: string;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectModel(WebhookEvent.name) private webhookEventModel: Model<WebhookEvent>,
    @InjectModel(ActionEvent.name) private actionEventModel: Model<ActionEvent>,
    private callsService: CallsService,
    private conversationsService: ConversationsService,
    private leadsService: LeadsService,
    private extractionService: LeadExtractionService,
    private qualificationService: QualificationService,
    private whatsappService: WhatsAppService,
    private followupGen: FollowupGenerationService,
    private config: ConfigService,
    @InjectQueue(FOLLOWUP_QUEUE)
  private readonly followupQueue: Queue,
  ) { }

  async handleVapiWebhook(payload: VapiWebhookEvent): Promise<WebhookProcessResult> {
    const providerEventId = this.extractEventId(payload);
    const eventType = payload.type || payload.message?.type || 'unknown';

    // Idempotency check
    const existing = await this.webhookEventModel.findOne({ providerEventId }).exec();
    if (existing) {
      this.logger.log({ providerEventId }, 'Duplicate Vapi webhook event, skipping');
      existing.status = 'duplicate';
      await existing.save();
      return { status: 'duplicate', message: 'Event already processed' };
    }

    // Store raw event
    const webhookEvent = await this.webhookEventModel.create({
      provider: 'vapi',
      providerEventId,
      eventType,
      status: 'received',
      rawPayload: payload as any,
    });

    const startTime = Date.now();

    try {
      const result = await this.processEvent(payload, eventType);
      webhookEvent.status = 'processed';
      webhookEvent.callId = result.callId ? new Types.ObjectId(result.callId) : undefined;
      webhookEvent.processingTimeMs = Date.now() - startTime;
      await webhookEvent.save();
      return result;
    } catch (err) {
      const errorMsg = (err as Error).message;
      webhookEvent.status = 'failed';
      webhookEvent.errorMessage = errorMsg;
      webhookEvent.processingTimeMs = Date.now() - startTime;
      await webhookEvent.save();
      this.logger.error({ err: errorMsg, providerEventId }, 'Vapi webhook processing failed');
      return { status: 'failed', message: errorMsg };
    }
  }

  private async processEvent(payload: VapiWebhookEvent, eventType: string): Promise<WebhookProcessResult> {
    // Never crash on unknown event types
    const call = payload.message?.call;
    const vapiCallId = call?.id;

    // Find internal call by Vapi call ID
    let internalCallId: string | undefined;
    if (vapiCallId) {
      const internalCall = await this.callsService.getCallByVapiId(vapiCallId);
      internalCallId = internalCall?._id?.toString();
    }

    // Handle different event types
    switch (eventType) {
      case 'status-update':
      case 'call-start':
        return this.handleStatusUpdate(payload, internalCallId);

      // case 'transcript':
      //   return this.handleTranscript(payload, internalCallId);

      // case 'tool-call':
      //   return this.handleToolCall(payload, internalCallId);

      case 'end-of-call-report':
      case 'call-ended': {
        await this.handleTranscript(payload, internalCallId);
        return this.handleEndOfCall(payload, internalCallId);
      }
      default:
        this.logger.log({ eventType }, 'Unknown Vapi event type, storing but not processing');
        return { status: 'ignored', message: `Unknown event type: ${eventType}` };
    }
  }

  private async handleStatusUpdate(payload: VapiWebhookEvent, callId?: string): Promise<WebhookProcessResult> {
    const call = payload.message?.call;
    if (!callId || !call) return { status: 'ignored', message: 'No internal call found for status update' };

    const status = this.mapVapiStatus(call.status);
    await this.callsService.updateCallStatus(callId, status, {
      startTime: call.startedAt ? new Date(call.startedAt) : undefined,
    });

    return { status: 'processed', callId };
  }

  private async handleTranscript(
    payload: VapiWebhookEvent,
    callId?: string,
  ): Promise<WebhookProcessResult> {

    const isEndOfCall =
      payload.message?.type === 'end-of-call-report';

    const transcript = isEndOfCall
      ? payload.message?.artifact?.transcript
      : payload.message?.transcript?.transcript;

    console.log("transcript", transcript)

    if (!callId || !transcript) {
      return {
        status: 'ignored',
        message: 'No transcript data',
      };
    }

    const role = isEndOfCall
      ? 'user'
      : ((payload.message?.transcript?.role as 'assistant' | 'user') || 'user');

    const language = isEndOfCall
      ? 'unknown'
      : (payload.message?.transcript?.language || 'unknown');

    const message = transcript.trim();

    if (!message) {
      return {
        status: 'ignored',
        message: 'Empty transcript',
      };
    }

    const providerEventId = this.extractEventId(payload);

    await this.conversationsService.addMessage({
      callId,
      role,
      message,
      language,
      providerEventId,
    });

    return {
      status: 'processed',
      callId,
    };
  }

  private async handleToolCall(payload: VapiWebhookEvent, callId?: string): Promise<WebhookProcessResult> {
    // Tool calls are handled by the voice tool endpoints directly.
    // Here we just record that a tool call event was received.
    const toolCall = payload.message?.toolCall;
    if (!toolCall) return { status: 'ignored', message: 'No tool call data' };

    this.logger.log(
      { toolName: toolCall.name, callId },
      'Vapi tool call event received (handled by voice tool endpoints)',
    );

    return { status: 'processed', callId };
  }

  async debugHandleEndOfCall(
    callId: string,
  ): Promise<WebhookProcessResult> {
    const webhookEvent = await this.webhookEventModel
      .findOne({
        provider: 'vapi',
        eventType: 'end-of-call-report',
        callId: new Types.ObjectId(callId),
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!webhookEvent) {
      return {
        status: 'failed',
        message: `No end-of-call-report found for callId: ${callId}`,
      };
    }

    this.logger.warn(
      {
        callId,
        webhookEventId: webhookEvent._id.toString(),
        providerEventId: webhookEvent.providerEventId,
      },
      'DEBUG: replaying stored Vapi end-of-call event',
    );
    console.log("webhookEvent", webhookEvent)

    return this.handleEndOfCall(
      webhookEvent.rawPayload as VapiWebhookEvent,
      callId,
    );
  }

  private async handleEndOfCall(payload: VapiWebhookEvent, callId?: string): Promise<WebhookProcessResult> {
    const call = payload.message?.call;
    if (!callId) return { status: 'ignored', message: 'No internal call for end-of-call' };

    const duration = payload.message?.artifact?.durationSeconds 
    const transcript = payload.message?.artifact?.transcript 
    const recordingUrl = payload.message?.artifact?.recordingUrl
    const summary = payload.message?.artifact?.summary || '' ;

    // Save transcript and end the call
    if (transcript) {
      await this.callsService.saveTranscript(callId, transcript);
    }

    await this.callsService.endCall(callId, duration, summary);

    if (recordingUrl) {
      await this.callsService.updateCallStatus(callId, 'ended', { recordingUrl });
    }

    // Extract lead and classify in real-time (not background, since end-of-call needs it)
    try {
      const extraction = await this.extractionService.extractFromConversation(callId);
      // console.log("extraction", extraction)
      const callDoc = await this.callsService.getCallById(callId);
      const lead = await this.leadsService.createOrUpdateFromExtraction(
        callId,
        callDoc.phoneNumber,
        extraction,
      );

      const fullTranscript = transcript || await this.conversationsService.getTranscriptText(callId);
      const qualification = await this.qualificationService.qualify({
        extractedData: extraction,
        transcript: fullTranscript,
      });

      await this.leadsService.updateQualification(
        lead._id,
        qualification.temperature,
        qualification.intentScore,
        qualification.confidence,
        qualification.evidence,
        qualification.reasoning,
      );

      await this.actionEventModel.create({
        type: 'LEAD_CLASSIFIED',
        callId: new Types.ObjectId(callId),
        leadId: lead._id,
        data: { temperature: qualification.temperature, intentScore: qualification.intentScore },
        success: true,
      });

      // Update call with lead reference
      await this.callsService.updateCallStatus(callId, 'ended', { leadId: lead._id });

      // HOT mid-call WhatsApp was already handled during the call if detected.
      // If it wasn't sent during the call (edge case), send it now.
      // if (qualification.temperature === 'HOT') {
      //   const alreadySent = await this.leadsService.hasHotWhatsappBeenSent(lead._id);
      //   if (!alreadySent) {
      //     this.logger.warn({ callId, leadId: lead._id.toString() }, 'HOT detected at end-of-call (not during call), sending WhatsApp now');
      //     await this.sendHotWhatsApp(callId, lead._id, lead.phoneNumber, fullTranscript, extraction);
      //   }
      // }

        const job =  await this.followupQueue.add(
      'POST_CALL_FOLLOWUP',
      {
        callId,
      },
      {
        jobId: `post-call-followup-${callId}`,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    console.log("JOB" , job.id)
    } catch (err) {
      this.logger.error({ err: (err as Error).message, callId }, 'Post-call extraction/classification failed');
    }

    return { status: 'processed', callId };
  }

  // async sendHotWhatsApp(
  //   callId: string,
  //   leadId: Types.ObjectId | string,
  //   phoneNumber: string,
  //   transcript: string,
  //   extraction: any,
  // ): Promise<void> {
  //   // Idempotency check
  //   const alreadySent = await this.leadsService.hasHotWhatsappBeenSent(leadId);
  //   if (alreadySent) {
  //     this.logger.log({ leadId: leadId.toString() }, 'HOT WhatsApp already sent, skipping');
  //     return;
  //   }

  //   // Record HOT_DETECTED action
  //   await this.actionEventModel.create({
  //     type: 'HOT_DETECTED',
  //     callId: new Types.ObjectId(callId),
  //     leadId: typeof leadId === 'string' ? new Types.ObjectId(leadId) : leadId,
  //     data: { trigger: 'hot-lead-detected' },
  //     success: true,
  //   });

  //   // Generate personalized message from actual conversation
  //   const message = await this.followupGen.generateFollowup({
  //     transcript,
  //     extractedData: extraction,
  //     temperature: 'HOT',
  //   });

  //   console.log("Generated HOT WhatsApp message:", message);

  //   // Record WHATSAPP_TRIGGERED
  //   await this.actionEventModel.create({
  //     type: 'WHATSAPP_TRIGGERED',
  //     callId: new Types.ObjectId(callId),
  //     leadId: typeof leadId === 'string' ? new Types.ObjectId(leadId) : leadId,
  //     data: { trigger: 'HOT_MID_CALL', messageLength: message.length },
  //     success: true,
  //   });

  //   // Send immediately (NOT in background queue)
  //   try {
  //     await this.whatsappService.sendTextMessage(phoneNumber, message, {
  //       leadId,
  //       triggerAction: 'HOT_MID_CALL',
  //     });

  //     await this.leadsService.markHotWhatsappSent(leadId);

  //     await this.actionEventModel.create({
  //       type: 'WHATSAPP_SENT',
  //       callId: new Types.ObjectId(callId),
  //       leadId: typeof leadId === 'string' ? new Types.ObjectId(leadId) : leadId,
  //       data: { trigger: 'HOT_MID_CALL' },
  //       success: true,
  //     });

  //     this.logger.log({ callId, leadId: leadId.toString() }, 'HOT mid-call WhatsApp sent successfully');
  //   } catch (err) {
  //     await this.actionEventModel.create({
  //       type: 'WHATSAPP_FAILED',
  //       callId: new Types.ObjectId(callId),
  //       leadId: typeof leadId === 'string' ? new Types.ObjectId(leadId) : leadId,
  //       data: { error: (err as Error).message, trigger: 'HOT_MID_CALL' },
  //       success: false,
  //     });
  //     this.logger.error({ err: (err as Error).message }, 'HOT mid-call WhatsApp send failed');
  //     throw err;
  //   }
  // }

  private extractEventId(payload: VapiWebhookEvent): string {
    // Vapi events may have an id at different levels
    const anyPayload = payload as any;
    return (
      anyPayload.id ||
      anyPayload.message?.call?.id + ':' + (anyPayload.type || anyPayload.message?.type) ||
      anyPayload.message?.call?.id + ':' + Date.now()
    );
  }

  private mapVapiStatus(vapiStatus?: string): 'ringing' | 'in-progress' | 'ended' | 'failed' | 'no-answer' | 'busy' | 'cancelled' {
    const map: Record<string, any> = {
      ringing: 'ringing',
      'in-progress': 'in-progress',
      ongoing: 'in-progress',
      ended: 'ended',
      completed: 'ended',
      failed: 'failed',
      'no-answer': 'no-answer',
      busy: 'busy',
      cancelled: 'cancelled',
      queued: 'initiated',
    };
    return map[vapiStatus || ''] || 'initiated';
  }

  async listEvents(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 15));

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.status?.trim()) {
      filter.status = params.status.trim();
    }

    if (params.search?.trim()) {
      const search = params.search.trim();

      filter.$or = [
        { providerEventId: { $regex: search, $options: 'i' } },
        { eventType: { $regex: search, $options: 'i' } },
        { provider: { $regex: search, $options: 'i' } },
        { errorMessage: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.webhookEventModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),

      this.webhookEventModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
