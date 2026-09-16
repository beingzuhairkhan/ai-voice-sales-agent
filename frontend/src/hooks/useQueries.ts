import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { dashboardService } from '@/api/services/dashboardService';
import { callsService } from '@/api/services/callsService';
import { leadsService } from '@/api/services/leadsService';
import { callbacksService } from '@/api/services/callbacksService';
import { whatsappService } from '@/api/services/whatsappService';
import { actionEventsService } from '@/api/services/actionEventsService';
import { webhookEventsService } from '@/api/services/webhookEventsService';
import { agentService, filesService, settingsService, healthService } from '@/api/services/systemService';
import type { PaginationParams, StartCallRequest, AgentConfiguration, AppSettings } from '@/types/api';

const ACTIVE_CALL_STATUSES = ['initiated', 'ringing', 'in-progress'];

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: dashboardService.getOverview,
    refetchInterval: 30000,
  });
}

export function useCalls(params: PaginationParams) {
  return useQuery({
    queryKey: ['calls', params],
    queryFn: () => callsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCall(id: string | undefined, options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: ['call', id],
    queryFn: () => callsService.get(id as string),
    enabled: !!id,
    refetchInterval: options?.refetchInterval,
  });
}

export function useCallTranscript(id: string | undefined) {
  return useQuery({
    queryKey: ['call', id, 'transcript'],
    queryFn: () => callsService.getTranscript(id as string),
    enabled: !!id,
  });
}

export function useCallLead(id: string | undefined) {
  return useQuery({
    queryKey: ['call', id, 'lead'],
    queryFn: () => callsService.getLead(id as string),
    enabled: !!id,
  });
}

export function useCallActions(id: string | undefined) {
  return useQuery({
    queryKey: ['call', id, 'actions'],
    queryFn: () => callsService.getActions(id as string),
    enabled: !!id,
  });
}

export function useStartCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StartCallRequest) => callsService.start(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCallPolling(id: string | undefined) {
  const query = useCall(id);
  const isActive =
    query.data && ACTIVE_CALL_STATUSES.includes(query.data.status);
  return {
    ...query,
    isActive: !!isActive,
    refetchInterval: isActive ? 5000 : false,
  };
}

export function useLeads(params: PaginationParams) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsService.get(id as string),
    enabled: !!id,
  });
}

export function useCallbacks(params: PaginationParams) {
  return useQuery({
    queryKey: ['callbacks', params],
    queryFn: () => callbacksService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useWhatsAppMessages(params: PaginationParams) {
  return useQuery({
    queryKey: ['whatsapp', params],
    queryFn: () => whatsappService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useActionEvents(params: PaginationParams) {
  return useQuery({
    queryKey: ['action-events', params],
    queryFn: () => actionEventsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useWebhookEvents(params: PaginationParams) {
  return useQuery({
    queryKey: ['webhook-events', params],
    queryFn: () => webhookEventsService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAgentConfiguration() {
  return useQuery({
    queryKey: ['agent', 'configuration'],
    queryFn: agentService.getConfiguration,
  });
}

export function useUpdateAgentConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AgentConfiguration>) => agentService.updateConfiguration(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent'] }),
  });
}

export function useFiles() {
  return useQuery({
    queryKey: ['files'],
    queryFn: filesService.list,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.get,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppSettings>) => settingsService.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: healthService.get,
    refetchInterval: 60000,
    retry: 1,
  });
}
