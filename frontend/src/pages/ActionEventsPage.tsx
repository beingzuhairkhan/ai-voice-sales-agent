import { useState, useMemo } from 'react';
import { RefreshCw, Eye, Phone } from 'lucide-react';
import { useActionEvents } from '@/hooks/useQueries';
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
import { getActionEventStyle, formatActionLabel } from '@/lib/actionEvents';
import { formatDateTime, cn } from '@/lib/utils';
import type { ActionEvent, PaginationParams } from '@/types/api';

const TYPE_OPTIONS = [
  { label: 'Call Started', value: 'CALL_STARTED' },
  { label: 'Call Ended', value: 'CALL_ENDED' },
  { label: 'HOT Detected', value: 'HOT_DETECTED' },
  { label: 'Lead Classified', value: 'LEAD_CLASSIFIED' },
  { label: 'WhatsApp Triggered', value: 'WHATSAPP_TRIGGERED' },
  { label: 'WhatsApp Sent', value: 'WHATSAPP_SENT' },
  { label: 'WhatsApp Failed', value: 'WHATSAPP_FAILED' },
  { label: 'Followup Generated', value: 'FOLLOWUP_GENERATED' },
  { label: 'Followup Sent', value: 'FOLLOWUP_SENT' },
  { label: 'Error', value: 'ERROR' },
];

// Action event `data` payloads vary by type (phoneNumber, error/phase, trigger,
// temperature/intentScore, ...). Pull a short headline out of whatever's there
// instead of assuming a fixed shape.
function eventHeadline(data?: Record<string, unknown> | null) {
  if (!data) return undefined;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.summary === 'string' && data.summary) return data.summary;
  return undefined;
}

export function ActionEventsPage() {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 15,
    search: '',
    status: '',
  });
  const [selected, setSelected] = useState<ActionEvent | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useActionEvents(params);

  const updateParam = (key: keyof PaginationParams, value: string | number) => {
    setParams((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  const events = data?.data ?? [];
  const total = data?.total ?? events.length;
  const totalPages = data?.totalPages ?? 1;
  const page = data?.page ?? params.page ?? 1;
  const limit = data?.limit ?? params.limit ?? 15;

  const columns = useMemo(
    () => [
      {
        key: 'type',
        header: 'Action',
        render: (row: any) => {
          // API returns `type`, not `actionType`.
          const actionType = row.type ?? row.actionType;
          const style = getActionEventStyle(actionType);
          const Icon = style.icon;
          return (
            <div className="flex items-center gap-2">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', style.color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-medium text-ink-900">{formatActionLabel(actionType)}</span>
            </div>
          );
        },
      },
      {
        key: 'phoneNumber',
        header: 'Phone',
        render: (row: any) => {
          // Phone number is nested under `data`, not top-level.
          const phoneNumber = row.data?.phoneNumber ?? row.phoneNumber;
          return phoneNumber ? (
            <span className="font-mono text-sm inline-flex items-center gap-1"><Phone className="w-3 h-3 text-ink-400" />{phoneNumber}</span>
          ) : <span className="text-ink-400">—</span>;
        },
      },
      {
        key: 'callId',
        header: 'Call ID',
        render: (row: ActionEvent) => <span className="font-mono text-xs text-ink-500">{row.callId ? row.callId.slice(-8) : '—'}</span>,
      },
      {
        key: 'success',
        header: 'Status',
        render: (row: any) => {
          // API returns a `success` boolean, not a `status` string.
          if (row.success == null && row.status == null) return <span className="text-ink-400">—</span>;
          const ok = row.success ?? row.status === 'success';
          const label = row.status ?? (ok ? 'Success' : 'Failed');
          return <Badge variant={ok ? 'success' : 'error'}>{label}</Badge>;
        },
      },
      {
        key: 'createdAt',
        header: 'Time',
        render: (row: ActionEvent) => <span className="text-sm text-ink-600">{formatDateTime(row.createdAt ?? row.timestamp)}</span>,
      },
      {
        key: 'actions',
        header: '',
        render: (row: ActionEvent) => (
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
        title="Activity / Action Events"
        description="System actions recorded during calls — HOT detection, lead classification, WhatsApp triggers, callbacks, and follow-ups."
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
            placeholder="Search phone or call ID…"
            className="w-full sm:w-64"
          />
          <Select
            value={params.status ?? ''}
            onChange={(v) => updateParam('status', v)}
            options={TYPE_OPTIONS}
            placeholder="All Action Types"
            ariaLabel="Filter by action type"
          />
        </FilterBar>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : isError ? (
        <ErrorState title="Could not load action events" message="The backend may be unreachable. Try refreshing." onRetry={() => refetch()} />
      ) : events.length === 0 ? (
        <EmptyState title="No action events found" message="No events match your filters, or no calls have been processed yet." />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={events}
            rowKey={(row: any) => row._id ?? row.id ?? Math.random().toString()}
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
        title="Action Event Details"
        size="md"
      >
        {selected && (() => {
          const s: any = selected;
          const actionType = s.type ?? s.actionType;
          const phoneNumber = s.data?.phoneNumber ?? s.phoneNumber;
          const ok = s.success ?? (s.status === 'success' ? true : s.status === 'failed' ? false : undefined);
          const statusLabel = s.status ?? (ok == null ? undefined : ok ? 'Success' : 'Failed');
          const headline = eventHeadline(s.data);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const style = getActionEventStyle(actionType);
                  const Icon = style.icon;
                  return (
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', style.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm font-semibold text-ink-900">{formatActionLabel(actionType)}</p>
                  {statusLabel && <Badge variant={ok ? 'success' : 'error'}>{statusLabel}</Badge>}
                </div>
              </div>

              <DetailGrid>
                <DetailField label="Action Type"><span className="font-mono text-xs">{actionType}</span></DetailField>
                <DetailField label="Phone Number"><span className="font-mono">{phoneNumber ?? '—'}</span></DetailField>
                <DetailField label="Call ID"><span className="font-mono text-xs break-all">{s.callId ?? '—'}</span></DetailField>
                <DetailField label="Lead ID"><span className="font-mono text-xs break-all">{s.leadId ?? '—'}</span></DetailField>
                <DetailField label="Time">{formatDateTime(s.createdAt ?? s.timestamp)}</DetailField>
                <DetailField label="Status">{statusLabel ?? '—'}</DetailField>
              </DetailGrid>

              {headline && (
                <div>
                  <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Message</p>
                  <p className="text-sm text-ink-700 p-3 rounded-lg bg-ink-50 border border-ink-200">{headline}</p>
                </div>
              )}

              {/* The event payload lives under `data`, not a separate `metadata` field. */}
              {s.data && Object.keys(s.data).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Event Data</p>
                  <JsonViewer data={s.data} />
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}