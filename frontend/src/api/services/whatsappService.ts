import api from '../client';
import type {
  WhatsAppMessage,
  Paginated,
  PaginationParams,
} from '@/types/api';

function extractPage<T>(r: {
  data?: T[];
  items?: T[];
  messages?: T[];
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
  const data = r.data ?? r.items ?? r.messages ?? [];

  const total = r.total ?? r.meta?.total ?? data.length;
  const page = r.page ?? r.meta?.page ?? 1;
  const limit = r.limit ?? r.meta?.limit ?? data.length;

  const totalPages =
    r.totalPages ??
    r.meta?.totalPages ??
    Math.max(1, Math.ceil(total / (limit || 1)));

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}

export const whatsappService = {
  list(params?: PaginationParams) {
    return api
      .get('/whatsapp/messages', { params })
      .then((r) => {
        console.log('WhatsApp API response:', r.data);

        const body = r.data;

        if (Array.isArray(body)) {
          return {
            data: body,
            total: body.length,
            page: 1,
            limit: body.length,
            totalPages: 1,
          };
        }

        return extractPage<WhatsAppMessage>(body);
      }) as Promise<Paginated<WhatsAppMessage>>;
  },
};
