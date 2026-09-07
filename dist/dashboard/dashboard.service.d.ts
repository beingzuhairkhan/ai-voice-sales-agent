import { Model } from 'mongoose';
import { Call } from '../calls/call.schema';
import { Lead } from '../leads/lead.schema';
import { Callback } from '../callback/callback.schema';
import { WhatsAppMessage } from '../whatsapp/whatsapp-message.schema';
import { ActionEvent } from '../common/types/action-event.schema';
export declare class DashboardService {
    private callModel;
    private leadModel;
    private callbackModel;
    private whatsappModel;
    private actionEventModel;
    private readonly logger;
    constructor(callModel: Model<Call>, leadModel: Model<Lead>, callbackModel: Model<Callback>, whatsappModel: Model<WhatsAppMessage>, actionEventModel: Model<ActionEvent>);
    getOverview(): Promise<{
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
    }>;
}
