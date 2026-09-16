import api from '../client';
import type { Lead, Paginated, PaginationParams } from '@/types/api';

function extractPage<T>(r: {
  leads?: T[];
  data?: T[];
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}): Paginated<T> {
  // Backend may return: leads, data, or items
  const data = r.leads ?? r.data ?? r.items ?? [];

  const total = r.total ?? r.meta?.total ?? data.length;

  const page = r.page ?? r.meta?.page ?? 1;

  const limit = r.limit ?? r.meta?.limit ?? data.length;

  const totalPages =
    r.totalPages ??
    r.meta?.totalPages ??
    Math.max(1, Math.ceil(total / (limit || 1)));

  console.log('Leads API response:', r);
  console.log('Extracted leads:', data);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}

export const leadsService = {
  list(params?: PaginationParams) {
    return api.get('/leads', { params }).then((r) => {
      const body = r.data;

      // Backend returned a raw array
      if (Array.isArray(body)) {
        return {
          data: body,
          total: body.length,
          page: 1,
          limit: body.length,
          totalPages: 1,
        };
      }

      // Backend returned { leads: [...] }
      return extractPage<Lead>(body);
    }) as Promise<Paginated<Lead>>;
  },

  get(id: string) {
    return api.get(`/leads/${id}`).then((r) => {
      const body = r.data as Record<string, unknown>;

      return (body.lead ?? body.data ?? body) as Lead;
    });
  },
};