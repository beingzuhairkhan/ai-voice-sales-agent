import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Clock, Calendar, CalendarCheck, MapPin, Phone, AlertCircle, FileText } from 'lucide-react';
import { useCallbacks } from '@/hooks/useQueries';
import { PageHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select, FilterBar } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { Breadcrumbs, DetailField, DetailGrid } from '@/components/ui/Breadcrumbs';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/States';
import { formatDateTime, formatPercent, cn } from '@/lib/utils';
import type { Callback, PaginationParams } from '@/types/api';

// The backend only ever reports these two statuses in practice ("requested"
// before a time is parsed/confirmed, "scheduled" once it's on the calendar).
// completed/cancelled/failed are kept as options in case the backend adds
// them later, but pending/confirmed/booked (the old option set) don't match
// any status this API actually returns.
const STATUS_OPTIONS = [
  { label: 'Requested', value: 'requested' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Failed', value: 'failed' },
];

function callbackStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'scheduled' || status === 'completed') return 'success';
  if (status === 'failed' || status === 'cancelled') return 'error';
  if (status === 'requested') return 'warning';
  return 'neutral';
}

export function CallbacksPage() {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
  });
  const [selected, setSelected] = useState<Callback | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useCallbacks(params);

  const updateParam = (key: keyof PaginationParams, value: string | number) => {
    setParams((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  // Response shape is `{ callbacks: [...] }`, not a generic `{ data: [...] }`
  // paginated envelope — and no pagination metadata comes back with it, so
  // fall back to values derived from the array/current params.
  const callbacks = data?.callbacks ?? data?.data ?? [];
  const total = data?.total ?? callbacks.length;
  const totalPages = data?.totalPages ?? 1;
  const page = data?.page ?? params.page ?? 1;
  const limit = data?.limit ?? params.limit ?? callbacks.length;

  const columns = useMemo(
    () => [
      {
        // Callback records don't include customer name/phone — that lives on
        // the call/lead. Show the linked call instead of a nonexistent "Unknown".
        key: 'reference',
        header: 'Call Reference',
        render: (row: Callback) => (
          <div>
            {row.callId ? (
              <Link to={`/calls/${row.callId}`} className="text-sm font-medium text-brand-600 hover:underline font-mono">
                {row.callId.slice(-8)}
              </Link>
            ) : (
              <span className="text-sm text-ink-400">—</span>
            )}
            {row.leadId && <p className="text-xs text-ink-500 font-mono">lead {row.leadId.slice(-8)}</p>}
          </div>
        ),
      },
      {
        key: 'reason',
        header: 'Reason',
        render: (row: Callback) => (
          <div className="max-w-[220px]">
            <p className="text-sm text-ink-700">{row.reason ?? '—'}</p>
          </div>
        ),
      },
      {
        key: 'requestedTimePhrase',
        header: 'Requested Time',
        render: (row: Callback) => (
          <span className="text-sm text-ink-700">{row.requestedTimePhrase ? formatDateTime(row.requestedTimePhrase) : '—'}</span>
        ),
      },
      {
        key: 'parsedDateTime',
        header: 'Scheduled',
        render: (row: Callback) => (
          <span className="text-sm text-ink-700">{row.parsedDateTime ? formatDateTime(row.parsedDateTime) : '—'}</span>
        ),
      },
      {
        key: 'timezone',
        header: 'Timezone',
        render: (row: Callback) => (
          <span className="text-xs text-ink-500 inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {row.timezone ?? '—'}
          </span>
        ),
      },
      {
        key: 'confidence',
        header: 'Confidence',
        render: (row: Callback) => <span className="text-sm tabular-nums">{row.confidence != null ? formatPercent(row.confidence) : '—'}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: Callback) => <Badge variant={callbackStatusVariant(row.status)}>{row.status}</Badge>,
      },
      {
        key: 'googleCalendarEventId',
        header: 'Calendar Event',
        render: (row: Callback) => (
          row.googleCalendarEventId ? (
            <span className="inline-flex items-center gap-1 text-xs text-success-700">
              <CalendarCheck className="w-3.5 h-3.5" />
              Booked
            </span>
          ) : <span className="text-xs text-ink-400">—</span>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Callbacks"
        description="Scheduled callbacks requested by customers during calls."
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
            placeholder="Search by call or lead ID…"
            className="w-full sm:w-64"
          />
          <Select
            value={params.status ?? ''}
            onChange={(v) => updateParam('status', v)}
            options={STATUS_OPTIONS}
            placeholder="All Statuses"
            ariaLabel="Filter by status"
          />
        </FilterBar>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : isError ? (
        <ErrorState title="Could not load callbacks" message="The backend may be unreachable. Try refreshing." onRetry={() => refetch()} />
      ) : callbacks.length === 0 ? (
        <EmptyState
          title="No callbacks found"
          message="No callbacks match your filters, or no callbacks have been requested yet. Callbacks are created when a customer asks to be called back during a call."
          icon={<Clock className="w-6 h-6" />}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={callbacks}
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
        title="Callback Details"
        description={selected?.reason ?? undefined}
      >
        {selected && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-brand-50 border border-brand-100">
              <p className="text-xs font-medium text-brand-700 uppercase tracking-wide mb-2">Reason</p>
              <p className="text-sm text-ink-800">{selected.reason ?? '—'}</p>
            </div>

            <div className="p-4 rounded-lg bg-success-50 border border-success-100">
              <p className="text-xs font-medium text-success-700 uppercase tracking-wide mb-2">
                {selected.parsedDateTime ? 'Confirmed Scheduled Time' : 'Requested Time (not yet confirmed)'}
              </p>
              <p className="text-sm font-semibold text-ink-900">
                {selected.parsedDateTime ? formatDateTime(selected.parsedDateTime) : (selected.requestedTimePhrase ? formatDateTime(selected.requestedTimePhrase) : '—')}
              </p>
              {selected.timezone && (
                <p className="text-xs text-ink-500 mt-1 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selected.timezone}
                </p>
              )}
            </div>

            <DetailGrid>
              <DetailField label="Status"><Badge variant={callbackStatusVariant(selected.status)}>{selected.status}</Badge></DetailField>
              <DetailField label="Confidence">{selected.confidence != null ? formatPercent(selected.confidence) : '—'}</DetailField>
              <DetailField label="Requested Time Phrase">{selected.requestedTimePhrase ? formatDateTime(selected.requestedTimePhrase) : '—'}</DetailField>
              <DetailField label="Notes">{selected.notes ?? '—'}</DetailField>
              <DetailField label="Google Calendar Event ID">
                <span className="font-mono text-xs break-all">{selected.googleCalendarEventId ?? '—'}</span>
              </DetailField>
              <DetailField label="Call ID">
                {selected.callId ? (
                  <Link to={`/calls/${selected.callId}`} className="inline-flex items-center gap-1 text-brand-600 hover:underline font-mono text-xs">
                    <Phone className="w-3 h-3" />
                    {selected.callId}
                  </Link>
                ) : '—'}
              </DetailField>
              <DetailField label="Lead ID">
                {selected.leadId ? (
                  <Link to={`/leads/${selected.leadId}`} className="inline-flex items-center gap-1 text-brand-600 hover:underline font-mono text-xs">
                    <FileText className="w-3 h-3" />
                    {selected.leadId}
                  </Link>
                ) : '—'}
              </DetailField>
              <DetailField label="Created At">{formatDateTime(selected.createdAt)}</DetailField>
              <DetailField label="Updated At">{formatDateTime(selected.updatedAt)}</DetailField>
            </DetailGrid>

            {selected.notes?.startsWith('Calendar event: http') && (
              <a
                href={selected.notes.replace('Calendar event: ', '')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs inline-flex"
              >
                <Calendar className="w-3.5 h-3.5" />
                Open Calendar Event
              </a>
            )}

            {selected.error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 border border-error-100">
                <AlertCircle className="w-4 h-4 text-error-600 shrink-0 mt-0.5" />
                <p className="text-sm text-error-700 font-mono break-all">{selected.error}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}