import api from '../client';
import type { DashboardOverview } from '@/types/api';

export const dashboardService = {
  getOverview() {
    return api.get<DashboardOverview>('/dashboard/overview').then((r) => r.data);
  },
};
