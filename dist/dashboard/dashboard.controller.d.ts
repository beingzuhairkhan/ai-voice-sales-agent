import { DashboardService } from './dashboard.service';
import { LeadsService } from '../leads/leads.service';
import { CallbackService } from '../callback/callback.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
declare class DashboardLeadQueryDto {
    page?: number;
    limit?: number;
    temperature?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}
export declare class DashboardController {
    private dashboardService;
    private leadsService;
    private callbackService;
    private whatsappService;
    constructor(dashboardService: DashboardService, leadsService: LeadsService, callbackService: CallbackService, whatsappService: WhatsAppService);
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
        recentActivity: import("../common/types/action-event.schema").ActionEvent[];
    }>;
    getLeads(query: DashboardLeadQueryDto): Promise<{
        leads: import("../leads/lead.schema").Lead[];
        total: number;
        page: number;
        limit: number;
    }>;
    getLead(id: string): Promise<import("../leads/lead.schema").Lead>;
    getCallbacks(page?: number, limit?: number, status?: string): Promise<{
        callbacks: import("../callback/callback.schema").Callback[];
        total: number;
        page: number;
        limit: number;
    }>;
    getWhatsappMessages(page?: number, limit?: number, status?: string, phoneNumber?: string): Promise<{
        messages: import("../whatsapp/whatsapp-message.schema").WhatsAppMessage[];
        total: number;
        page: number;
        limit: number;
    }>;
}
export {};
