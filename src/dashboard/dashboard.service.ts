import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Call } from '../calls/call.schema';
import { Lead } from '../leads/lead.schema';
import { Callback } from '../callback/callback.schema';
import { WhatsAppMessage } from '../whatsapp/whatsapp-message.schema';
import { ActionEvent } from '../common/types/action-event.schema';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Call.name) private callModel: Model<Call>,
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    @InjectModel(Callback.name) private callbackModel: Model<Callback>,
    @InjectModel(WhatsAppMessage.name) private whatsappModel: Model<WhatsAppMessage>,
    @InjectModel(ActionEvent.name) private actionEventModel: Model<ActionEvent>,
  ) {}

  async getOverview(): Promise<{
    totalCalls: number;
    completedCalls: number;
    failedCalls: number;
    inProgressCalls: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    totalCallbacks: number;
    scheduledCallbacks: number;
    totalWhatsappMessages: number;
    sentWhatsappMessages: number;
    failedWhatsappMessages: number;
    recentActivity: ActionEvent[];
  }> {
    const [
      totalCalls,
      completedCalls,
      failedCalls,
      inProgressCalls,
      hotLeads,
      warmLeads,
      coldLeads,
      totalCallbacks,
      scheduledCallbacks,
      totalWhatsappMessages,
      sentWhatsappMessages,
      failedWhatsappMessages,
      recentActivity,
    ] = await Promise.all([
      this.callModel.countDocuments().exec(),
      this.callModel.countDocuments({ status: 'ended' }).exec(),
      this.callModel.countDocuments({ status: { $in: ['failed', 'no-answer', 'busy', 'cancelled'] } }).exec(),
      this.callModel.countDocuments({ status: { $in: ['initiated', 'ringing', 'in-progress'] } }).exec(),
      this.leadModel.countDocuments({ temperature: 'HOT' }).exec(),
      this.leadModel.countDocuments({ temperature: 'WARM' }).exec(),
      this.leadModel.countDocuments({ temperature: 'COLD' }).exec(),
      this.callbackModel.countDocuments().exec(),
      this.callbackModel.countDocuments({ status: 'scheduled' }).exec(),
      this.whatsappModel.countDocuments().exec(),
      this.whatsappModel.countDocuments({ status: 'sent' }).exec(),
      this.whatsappModel.countDocuments({ status: 'failed' }).exec(),
      this.actionEventModel.find().sort({ createdAt: -1 }).limit(20).exec(),
    ]);

    return {
      totalCalls,
      completedCalls,
      failedCalls,
      inProgressCalls,
      hotLeads,
      warmLeads,
      coldLeads,
      totalCallbacks,
      scheduledCallbacks,
      totalWhatsappMessages,
      sentWhatsappMessages,
      failedWhatsappMessages,
      recentActivity,
    };
  }
}
