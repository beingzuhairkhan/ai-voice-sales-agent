import { useState, useMemo } from 'react';
import { RefreshCw, Eye, Webhook, AlertCircle, CheckCircle2, Copy, HelpCircle } from 'lucide-react';
import { useWebhookEvents } from '@/hooks/useQueries';
import { PageHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select, FilterBar } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Breadcrumbs, DetailField, DetailGrid } from '@/components/ui/Breadcrumbs';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/States';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { formatDateTime, cn } from '@/lib/utils';
import type { WebhookEvent, PaginationParams } from '@/types/api';

const STATUS_OPTIONS = [
  { label: 'Processed', value: 'processed' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Failed', value: 'failed' },
  { label: 'Unknown', value: 'unknown' },
  { label: 'Ignored', value: 'ignored' },
];

function webhookStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'processed') return 'success';
  if (status === 'duplicate') return 'warning';
  if (status === 'failed') return 'error';
  return 'neutral';
}

function webhookStatusIcon(status: string) {
  if (status === 'processed') return <CheckCircle2 className="w-3 h-3" />;
  if (status === 'duplicate') return <Copy className="w-3 h-3" />;
  if (status === 'failed') return <AlertCircle className="w-3 h-3" />;
  return <HelpCircle className="w-3 h-3" />;
}

export function WebhookEventsPage() {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 15,
    search: '',
    status: '',
  });
  const [selected, setSelected] = useState<WebhookEvent | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useWebhookEvents(params);

  const updateParam = (key: keyof PaginationParams, value: string | number) => {
    setParams((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  const events = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const page = data?.page ?? 1;
  const limit = data?.limit ?? 15;

  const columns = useMemo(
    () => [
      {
        key: 'eventType',
        header: 'Event Type',
        render: (row: WebhookEvent) => (
          <span className="text-sm font-medium text-ink-900 font-mono">{row.eventType ?? '—'}</span>
        ),
      },
      {
        key: 'providerEventId',
        header: 'Provider Event ID',
        render: (row: WebhookEvent) => (
          <span className="font-mono text-xs text-ink-500">{row.providerEventId?.slice(-12) ?? '—'}</span>
        ),
      },
      {
        key: 'callId',
        header: 'Call ID',
        render: (row: WebhookEvent) => <span className="font-mono text-xs text-ink-500">{row.callId?.slice(-8) ?? '—'}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: WebhookEvent) => (
          <Badge variant={webhookStatusVariant(row.status)}>
            {webhookStatusIcon(row.status)}
            {row.status}
          </Badge>
        ),
      },
      {
        key: 'receivedAt',
        header: 'Received',
        render: (row: WebhookEvent) => <span className="text-sm text-ink-600">{formatDateTime(row.receivedAt ?? row.createdAt)}</span>,
      },
      {
        key: 'retryCount',
        header: 'Retries',
        render: (row: WebhookEvent) => <span className="text-sm tabular-nums">{row.retryCount ?? 0}</span>,
      },
      {
        key: 'actions',
        header: '',
        render: (row: WebhookEvent) => (
          <button onClick={(e) => { e.stopPropagation(); setSelected(row); }} className="btn-ghost text-xs">
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Webhook Events"
        description="Vapi webhook events processed by the backend. The backend processes these idempotently — duplicates are skipped."
        actions={
          <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100 mb-4">
        <Webhook className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-brand-800">
            The backend receives Vapi webhooks at <code className="font-mono text-xs bg-brand-100 px-1.5 py-0.5 rounded">POST /api/v1/webhooks/vapi</code>.
          </p>
          <p className="text-xs text-brand-700 mt-1">
            This is a server-only endpoint — it is not a browser-facing action. This page shows events the backend has already processed.
          </p>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <FilterBar>
          <SearchInput
            value={params.search ?? ''}
            onChange={(v) => updateParam('search', v)}
            placeholder="Search event type or call ID…"
            className="w-full sm:w-64"
          />
          <Select
            value={params.status ?? ''}
            onChange={(v) => updateParam('status', v)}
            options={STATUS_OPTIONS}
            placeholder="All Statuses"
            ariaLabel="Filter by processing status"
          />
        </FilterBar>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : isError ? (
        <ErrorState title="Could not load webhook events" message="The backend may be unreachable or the webhook events endpoint is not available. Try refreshing." onRetry={() => refetch()} />
      ) : events.length === 0 ? (
        <EmptyState
          title="No webhook events found"
          message="No events match your filters, or no Vapi webhooks have been received yet. Events appear here once the backend processes them."
          icon={<Webhook className="w-6 h-6" />}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={events}
            rowKey={(row) => row._id ?? row.id ?? Math.random().toString()}
            onRowClick={(row) => setSelected(row)}
          />
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={(p) => updateParam('page', p)} />
          </div>
        </>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Webhook Event Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={webhookStatusVariant(selected.status)}>
                {webhookStatusIcon(selected.status)}
                {selected.status}
              </Badge>
              {selected.eventType && <Badge variant="neutral">{selected.eventType}</Badge>}
            </div>

            <DetailGrid>
              <DetailField label="Provider Event ID"><span className="font-mono text-xs break-all">{selected.providerEventId ?? '—'}</span></DetailField>
              <DetailField label="Event Type"><span className="font-mono text-sm">{selected.eventType ?? '—'}</span></DetailField>
              <DetailField label="Call ID"><span className="font-mono text-xs break-all">{selected.callId ?? '—'}</span></DetailField>
              <DetailField label="Status"><Badge variant={webhookStatusVariant(selected.status)}>{selected.status}</Badge></DetailField>
              <DetailField label="Received At">{formatDateTime(selected.receivedAt ?? selected.createdAt)}</DetailField>
              <DetailField label="Processed At">{formatDateTime(selected.processedAt)}</DetailField>
              <DetailField label="Retry Count">{selected.retryCount ?? 0}</DetailField>
            </DetailGrid>

            {selected.error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 border border-error-100">
                <AlertCircle className="w-4 h-4 text-error-600 shrink-0 mt-0.5" />
                <p className="text-sm text-error-700 font-mono break-all">{selected.error}</p>
              </div>
            )}

            {(selected.payload ?? selected.sanitizedPayload) && (
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">
                  Sanitized Payload
                </p>
                <p className="text-xs text-ink-400 mb-2">
                  Authorization headers, API keys, and sensitive data have been removed by the backend.
                </p>
                <JsonViewer data={selected.sanitizedPayload ?? selected.payload} />
              </div>
            )}

            <div className="p-3 rounded-lg bg-ink-50 border border-ink-100">
              <p className="text-xs text-ink-500">
                The backend processes webhook events idempotently. Duplicate events (same provider event ID) are skipped. Unknown event types are marked as unknown/ignored rather than causing errors.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
