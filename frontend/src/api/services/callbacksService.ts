import api from '../client';
import type { Callback, Paginated, PaginationParams } from '@/types/api';

function extractPage<T>(r: {
  callbacks?: T[];
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
  // Backend response can be:
  // { callbacks: [...] }
  // { data: [...] }
  // { items: [...] }
  const data = r.callbacks ?? r.data ?? r.items ?? [];

  const total = r.total ?? r.meta?.total ?? data.length;

  const page = r.page ?? r.meta?.page ?? 1;

  const limit = r.limit ?? r.meta?.limit ?? data.length;

  const totalPages =
    r.totalPages ??
    r.meta?.totalPages ??
    Math.max(1, Math.ceil(total / (limit || 1)));

  console.log('Callbacks API response:', r);
  console.log('Extracted callbacks:', data);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}

export const callbacksService = {
  list(params?: PaginationParams) {
    return api.get('/callbacks', { params }).then((r) => {
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

      // Backend returned:
      // { callbacks: [...], total, page, limit }
      return extractPage<Callback>(body);
    }) as Promise<Paginated<Callback>>;
  },
};