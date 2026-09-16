import api from '../client';
import type { ActionEvent, Paginated, PaginationParams } from '@/types/api';

function extractPage<T>(r: { data?: T[]; items?: T[]; total?: number; page?: number; limit?: number; totalPages?: number; meta?: { total?: number; page?: number; limit?: number; totalPages?: number } }): Paginated<T> {
  const data = r.data ?? r.items ?? [];
  const total = r.total ?? r.meta?.total ?? data.length;
  const page = r.page ?? r.meta?.page ?? 1;
  const limit = r.limit ?? r.meta?.limit ?? data.length;
  const totalPages = r.totalPages ?? r.meta?.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)));
  return { data, total, page, limit, totalPages };
}

export const actionEventsService = {
  list(params?: PaginationParams) {
    return api.get('/Calls/actions', { params }).then((r) => {
      const body = r.data;
      if (Array.isArray(body)) return { data: body, total: body.length, page: 1, limit: body.length, totalPages: 1 };
      return extractPage<ActionEvent>(body as Paginated<ActionEvent>);
    }) as Promise<Paginated<ActionEvent>>;
  },
};