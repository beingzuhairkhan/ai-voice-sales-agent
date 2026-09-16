import api from '../client';
import type { AgentConfiguration, AppSettings, FileAsset, HealthStatus } from '@/types/api';

export const agentService = {
  getConfiguration() {
    return api.get('/agent/configuration').then((r) => {
      const body = r.data;
      return (body.configuration ?? body.data ?? body) as AgentConfiguration;
    });
  },
  updateConfiguration(data: Partial<AgentConfiguration>) {
    return api.patch('/agent/configuration', data).then((r) => {
      const body = r.data;
      return (body.configuration ?? body.data ?? body) as AgentConfiguration;
    });
  },
};

export const filesService = {
  list() {
    return api.get('/files').then((r) => {
      const body = r.data;
      if (Array.isArray(body)) return body as FileAsset[];
      return (body.files ?? body.data ?? body.items ?? []) as FileAsset[];
    });
  },
};

export const settingsService = {
  get() {
    return api.get('/settings').then((r) => {
      const body = r.data;
      return (body.settings ?? body.data ?? body) as AppSettings;
    });
  },
  update(data: Partial<AppSettings>) {
    return api.patch('/settings', data).then((r) => {
      const body = r.data;
      return (body.settings ?? body.data ?? body) as AppSettings;
    });
  },
};

export const healthService = {
  get() {
    return api.get<HealthStatus>('/health', { baseURL: '' }).then((r) => r.data);
  },
};
