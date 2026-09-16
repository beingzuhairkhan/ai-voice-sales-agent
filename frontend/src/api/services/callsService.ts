import api from '../client';
import type {
  Call,
  Paginated,
  PaginationParams,
  StartCallRequest,
  StartCallResponse,
  TranscriptMessage,
  Lead,
  ActionEvent,
} from '@/types/api';

function extractPage<T>(r: {
  calls?: T[];
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
  const data = r.calls ?? r.data ?? r.items ?? [];

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

export const callsService = {
  list(params?: PaginationParams) {
    return api.get('/calls', { params }).then((r) => {
      const body = r.data;
      if (Array.isArray(body)) return { data: body, total: body.length, page: 1, limit: body.length, totalPages: 1 };
      return extractPage<Call>(body as Paginated<Call>);
    }) as Promise<Paginated<Call>>;
  },
  get(id: string) {
    return api.get<Call>(`/calls/${id}`).then((r) => r.data);
  },
  getTranscript(id: string) {
    return api.get(`/calls/${id}/transcript`).then((r) => {
      const body = r.data;
      if (Array.isArray(body)) return body as TranscriptMessage[];
      return (body.transcript ?? body.data ?? body.messages ?? []) as TranscriptMessage[];
    });
  },
  getLead(id: string) {
    return api.get(`/calls/${id}/lead`).then((r) => {
      const body = r.data;
      return (body.lead ?? body.data ?? body) as Lead;
    });
  },
  getActions(id: string) {
    return api.get(`/calls/${id}/actions`).then((r) => {
      const body = r.data;
      if (Array.isArray(body)) return body as ActionEvent[];
      return (body.actions ?? body.data ?? body.events ?? []) as ActionEvent[];
    });
  },
  start(data: StartCallRequest) {
    return api.post<StartCallResponse>('/calls/start', data).then((r) => r.data);
  },
};
