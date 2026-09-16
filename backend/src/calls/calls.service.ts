import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Call, CallStatus } from './call.schema';
import { VapiProvider } from '../vapi/vapi-provider';
import { ActionEvent } from '../common/types/action-event.schema';
import { LeadsService } from '@/leads/leads.service';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);
  private readonly defaultPhoneNumber: string;

  constructor(
    @InjectModel(Call.name) private callModel: Model<Call>,
    @InjectModel(ActionEvent.name) private actionEventModel: Model<ActionEvent>,
    private vapiProvider: VapiProvider,
    private config: ConfigService,
    private leadsService: LeadsService,
  ) {
    this.defaultPhoneNumber = this.config.get<string>('VAPI_PHONE_NUMBER', '+918688664337');
  }

  async startCall(phoneNumber?: string, assistantId?: string, context?: {
    callbackId?: string;
    originalCallId?: string;
    transcript?: string;
    lead?: any;
  },): Promise<{
    callId: string;
    vapiCallId: string;
    status: string;
  }> {
    const targetPhone = phoneNumber || '+918688664337';
    this.logger.log({ phoneNumber: targetPhone }, 'Starting outbound call');

    // Create MongoDB Call record BEFORE calling Vapi
    const callDoc = await this.callModel.create({
      phoneNumber: targetPhone,
      status: 'initiated' as CallStatus,
      startTime: new Date(),
      metadata: {
        assistantId:
          assistantId ||
          this.config.get<string>('VAPI_ASSISTANT_ID'),

        callbackId: context?.callbackId,
        originalCallId: context?.originalCallId,

        // Store context so webhook/other services can access it
        callbackContext: context
          ? {
            transcript: context.transcript,
            lead: context.lead,
          }
          : undefined,
      },
    });

    // create lead immediately

    const lead = await this.leadsService.createInitialLead({
      callId: callDoc._id,
      phoneNumber: targetPhone,
      status: 'IN_PROGRESS',
    })

    callDoc.leadId = lead._id;
    await callDoc.save();

    // Record action event
    await this.recordAction(
      callDoc._id,
      'CALL_STARTED',
      {
        phoneNumber: targetPhone,
        callbackId: context?.callbackId,
        originalCallId: context?.originalCallId,
      },
    );

    try {
      const vapiResult = await this.vapiProvider.startOutboundCall({
        phoneNumber: targetPhone,
        assistantId,
        metadata: {
          internalCallId: callDoc._id.toString(),
          leadId: lead._id.toString(),
          callId: callDoc._id.toString(),

          callbackId: context?.callbackId,
          originalCallId: context?.originalCallId,

          // Pass context to Vapi
          callbackContext: context
            ? JSON.stringify(context)
            : undefined,
        },
      });

      // Save Vapi call ID

      callDoc.vapiCallId = vapiResult.vapiCallId;
      callDoc.status = vapiResult.status as CallStatus;
      await callDoc.save();

      this.logger.log(
        { callId: callDoc._id.toString(), vapiCallId: vapiResult.vapiCallId },
        'Outbound call initiated via Vapi',
      );

      return {
        callId: callDoc._id.toString(),
        vapiCallId: vapiResult.vapiCallId,
        status: callDoc.status,
      };
    } catch (err) {
      const errorMsg = (err as Error).message;
      callDoc.status = 'failed' as CallStatus;
      callDoc.metadata.error = errorMsg;
      await callDoc.save();
      await this.recordAction(callDoc._id, 'ERROR', { error: errorMsg, phase: 'startCall' }, false);
      this.logger.error({ err: errorMsg, callId: callDoc._id.toString() }, 'Vapi call failed to start');
      throw err;
    }
  }

  async getCalls(query: {
    page?: number;
    limit?: number;
    status?: string;
    phoneNumber?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ calls: Call[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};

    if (query.status) filter.status = query.status;
    if (query.phoneNumber) filter.phoneNumber = query.phoneNumber;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const [calls, total] = await Promise.all([
      this.callModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.callModel.countDocuments(filter).exec(),
    ]);

    return { calls, total, page, limit };
  }

  async getCallById(id: string): Promise<Call> {
    const call = await this.callModel.findById(id).exec();
    if (!call) throw new NotFoundException(`Call ${id} not found`);
    return call;
  }

  async getCallByVapiId(vapiCallId: string): Promise<Call | null> {
    return this.callModel.findOne({ vapiCallId }).exec();
  }

  async updateCallStatus(
    id: Types.ObjectId | string,
    status: CallStatus,
    extra?: Partial<Call>,
  ): Promise<Call | null> {
    const update: Record<string, any> = { status, ...extra };
    return this.callModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async setVapiCallId(id: Types.ObjectId | string, vapiCallId: string): Promise<void> {
    await this.callModel.findByIdAndUpdate(id, { vapiCallId }).exec();
  }

  async saveTranscript(id: Types.ObjectId | string, transcript: string): Promise<void> {
    await this.callModel.findByIdAndUpdate(id, { transcript }).exec();
  }

  async endCall(id: Types.ObjectId | string, duration?: number, summary?: string): Promise<void> {
    const update: Record<string, any> = {
      status: 'ended' as CallStatus,
      endTime: new Date(),
    };
    if (duration !== undefined) update.duration = duration;
    if (summary) update.summary = summary;
    await this.callModel.findByIdAndUpdate(id, update).exec();
    await this.recordAction(id, 'CALL_ENDED', { duration, summary });
  }

  async getActionsByCallId(id: string): Promise<ActionEvent[]> {
    return this.actionEventModel
      .find({ callId: new Types.ObjectId(id) })
      .sort({ createdAt: 1 })
      .exec();
  }

  async recordAction(
    callId: Types.ObjectId | string,
    type: string,
    data: Record<string, any> = {},
    success = true,
  ): Promise<ActionEvent> {
    return this.actionEventModel.create({
      type: type as any,
      callId: typeof callId === 'string' ? new Types.ObjectId(callId) : callId,
      data,
      success,
    });
  }

  async getAllActions(page: number = 1, limit: number = 10, search?: string, status?: string) {
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (status && status.trim() !== '') {
      filter.status = status;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },

      ];
    }

    // Run queries in parallel
    const [data, total] = await Promise.all([
      this.actionEventModel
        .find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.actionEventModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  
}
