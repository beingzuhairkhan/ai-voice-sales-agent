import { useState, useMemo } from 'react';
import { RefreshCw, MessageSquare, Send, Flame, FileText, AlertCircle, ExternalLink, Paperclip } from 'lucide-react';
import { useWhatsAppMessages } from '@/hooks/useQueries';
import { PageHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select, FilterBar } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Breadcrumbs, DetailField, DetailGrid } from '@/components/ui/Breadcrumbs';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/States';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { formatDateTime, truncate, cn } from '@/lib/utils';
import type { WhatsAppMessage, PaginationParams } from '@/types/api';

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Read', value: 'read' },
  { label: 'Failed', value: 'failed' },
];

// The campaign category is `triggerAction`, not `type` — `type` is the
// WhatsApp message format ("template", "text", ...). "HOT_MID_CALL" is
// confirmed from real data; the follow-up value is inferred from the
// FOLLOWUP_SENT/FOLLOWUP_GENERATED action-event names used elsewhere in
// the backend — verify against a real follow-up record and adjust if the
// backend uses a different string.
const TYPE_OPTIONS = [
  { label: 'Mid-Call (HOT)', value: 'HOT_MID_CALL' },
  { label: 'Follow-up', value: 'FOLLOWUP' },
];

function statusVariant(status: string): 'success' | 'info' | 'warning' | 'error' | 'neutral' {
  if (status === 'delivered' || status === 'read') return 'success';
  if (status === 'sent') return 'info';
  if (status === 'failed') return 'error';
  if (status === 'pending') return 'warning';
  return 'neutral';
}

function triggerBadge(triggerAction?: string) {
  if (triggerAction === 'HOT_MID_CALL') {
    return <Badge variant="error"><Flame className="w-3 h-3" /> Mid-Call HOT</Badge>;
  }
  if (triggerAction?.includes('FOLLOWUP')) {
    return <Badge variant="info"><FileText className="w-3 h-3" /> Follow-up</Badge>;
  }
  return <Badge variant="neutral">{triggerAction ?? 'Unknown'}</Badge>;
}

export function WhatsAppPage() {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
  });
  const [selected, setSelected] = useState<WhatsAppMessage | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useWhatsAppMessages(params);

  const updateParam = (key: keyof PaginationParams, value: string | number) => {
    setParams((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  // Response shape is `{ messages: [...] }`, not a generic `{ data: [...] }` envelope.
  const messages = data?.messages ?? data?.data ?? [];
  const total = data?.total ?? messages.length;
  const totalPages = data?.totalPages ?? 1;
  const page = data?.page ?? params.page ?? 1;
  const limit = data?.limit ?? params.limit ?? messages.length;

  const columns = useMemo(
    () => [
      {
        key: 'triggerAction',
        header: 'Type',
        render: (row: WhatsAppMessage) => (
          <div className="inline-flex items-center gap-1.5">
            {triggerBadge(row.triggerAction)}
          </div>
        ),
      },
      {
        key: 'phoneNumber',
        header: 'Phone',
        render: (row: WhatsAppMessage) => <span className="font-mono text-sm">{row.phoneNumber}</span>,
      },
      {
        key: 'message',
        header: 'Message',
        render: (row: WhatsAppMessage) => (
          // API returns `message`, not `content`/`body`.
          <span className="text-sm text-ink-600 max-w-[300px] block">{truncate(row.message ?? row.content ?? row.body, 50)}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: WhatsAppMessage) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
      },
      {
        key: 'createdAt',
        header: 'Time',
        // No `sentAt` field on the message — use the real timestamps that exist.
        render: (row: WhatsAppMessage) => <span className="text-sm text-ink-600">{formatDateTime(row.sentAt ?? row.createdAt)}</span>,
      },
      {
        key: 'providerMessageId',
        header: 'Provider ID',
        render: (row: WhatsAppMessage) => (
          <span className="font-mono text-xs text-ink-500">{row.providerMessageId ? truncate(row.providerMessageId, 20) : '—'}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="WhatsApp Messages"
        description="Mid-call HOT messages and post-call personalized follow-ups sent through the backend."
        actions={
          <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <div className="card p-4 mb-4">
        <FilterBar>
          <SearchInput
            value={params.search ?? ''}
            onChange={(v) => updateParam('search', v)}
            placeholder="Search phone or message…"
            className="w-full sm:w-64"
          />
          <Select
            value={params.status ?? ''}
            onChange={(v) => updateParam('status', v)}
            options={STATUS_OPTIONS}
            placeholder="All Statuses"
            ariaLabel="Filter by status"
          />
          <Select
            // Was wired to `params.temperature` — a copy-paste leftover from the
            // leads page filter. This filters by trigger action, not temperature.
            value={params.triggerAction ?? ''}
            onChange={(v) => updateParam('triggerAction', v)}
            options={TYPE_OPTIONS}
            placeholder="All Types"
            ariaLabel="Filter by type"
          />
        </FilterBar>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : isError ? (
        <ErrorState title="Could not load WhatsApp messages" message="The backend may be unreachable. Try refreshing." onRetry={() => refetch()} />
      ) : messages.length === 0 ? (
        <EmptyState
          title="No WhatsApp messages found"
          message="No messages match your filters, or no messages have been sent yet. Messages are sent automatically when HOT intent is detected (mid-call) or after a call ends (follow-up)."
          icon={<MessageSquare className="w-6 h-6" />}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={messages}
            rowKey={(row) => row._id ?? row.id ?? Math.random().toString()}
            onRowClick={(row) => setSelected(row)}
          />
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={(p) => updateParam('page', p)} />
          </div>
        </>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="WhatsApp Message Details"
        description={selected?.phoneNumber}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              {triggerBadge(selected.triggerAction)}
              <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
            </div>

            {/* Message content */}
            <div>
              <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Message Content</p>
              <div className="p-4 rounded-lg bg-ink-50 border border-ink-200">
                <p className="text-sm text-ink-800 whitespace-pre-wrap">{selected.message ?? selected.content ?? selected.body ?? '—'}</p>
              </div>
            </div>

            <DetailGrid>
              <DetailField label="Phone Number"><span className="font-mono">{selected.phoneNumber}</span></DetailField>
              {/* `type` is the WhatsApp message format (template/text), distinct from `triggerAction` (the campaign) */}
              <DetailField label="Format Type">{selected.type ?? '—'}</DetailField>
              <DetailField label="Trigger Action">{selected.triggerAction ?? '—'}</DetailField>
              <DetailField label="Provider Message ID"><span className="font-mono text-xs break-all">{selected.providerMessageId ?? '—'}</span></DetailField>
              <DetailField label="Status"><Badge variant={statusVariant(selected.status)}>{selected.status}</Badge></DetailField>
              <DetailField label="Created At">{formatDateTime(selected.createdAt)}</DetailField>
              <DetailField label="Updated At">{formatDateTime(selected.updatedAt)}</DetailField>
              <DetailField label="Call ID"><span className="font-mono text-xs">{selected.callId ?? '—'}</span></DetailField>
              <DetailField label="Lead ID"><span className="font-mono text-xs">{selected.leadId ?? '—'}</span></DetailField>
            </DetailGrid>

            {/* Attachments */}
            {selected.attachments && selected.attachments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Attachments</p>
                <div className="space-y-2">
                  {selected.attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-ink-200">
                      <Paperclip className="w-4 h-4 text-ink-400" />
                      <span className="text-sm text-ink-700 flex-1">{att.name ?? att.type ?? 'Attachment'}</span>
                      {att.url && (
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.mediaUrl && (
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Media URL</p>
                <a href={selected.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  View media
                </a>
              </div>
            )}

            {/* API returns `errorInfo: { message, timestamp }`, not a plain `error` string */}
            {(selected.errorInfo ?? selected.error) && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 border border-error-100">
                <AlertCircle className="w-4 h-4 text-error-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-error-700 font-mono break-all">
                    {selected.errorInfo?.message ?? selected.error}
                  </p>
                  {selected.errorInfo?.timestamp && (
                    <p className="text-xs text-error-500 mt-1">{formatDateTime(selected.errorInfo.timestamp)}</p>
                  )}
                </div>
              </div>
            )}

            {selected.providerResponse && (
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Provider Response</p>
                <JsonViewer data={selected.providerResponse} />
              </div>
            )}

            {selected.deliveryInfo && (
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Delivery Information</p>
                <JsonViewer data={selected.deliveryInfo} />
              </div>
            )}

            <div className="p-3 rounded-lg bg-ink-50 border border-ink-100">
              <p className="text-xs text-ink-500">
                <Send className="w-3 h-3 inline mr-1" />
                Messages are sent by the NestJS backend through the WhatsApp Business API. No access tokens or credentials are exposed in this dashboard.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}