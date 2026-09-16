import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, RefreshCw, Eye } from 'lucide-react';
import { useCalls } from '@/hooks/useQueries';
import { PageHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select, FilterBar } from '@/components/ui/Select';
import { CallStatusBadge } from '@/components/ui/CallStatusBadge';
import { TemperatureBadge } from '@/components/ui/TemperatureBadge';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/States';
import { StartCallModal } from '@/components/StartCallModal';
import { formatDateTime, formatDuration, truncate } from '@/lib/utils';
import type { Call, PaginationParams } from '@/types/api';

const STATUS_OPTIONS = [
  { label: 'Initiated', value: 'initiated' },
  { label: 'Ringing', value: 'ringing' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'No Answer', value: 'no-answer' },
  { label: 'Busy', value: 'busy' },
  { label: 'Cancelled', value: 'cancelled' },
];

const TEMP_OPTIONS = [
  { label: 'HOT', value: 'HOT' },
  { label: 'WARM', value: 'WARM' },
  { label: 'COLD', value: 'COLD' },
];

export function CallsPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    temperature: '',
  });

  const { data, isLoading, isError, refetch, isFetching } = useCalls(params);

  const updateParam = (key: keyof PaginationParams, value: string | number) => {
    setParams((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  const calls = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const page = data?.page ?? 1;
  const limit = data?.limit ?? 10;

  const columns = useMemo(
    () => [
      {
        key: 'phoneNumber',
        header: 'Phone Number',
        render: (row: Call) => <span className="font-mono text-sm">{row.phoneNumber}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: Call) => <CallStatusBadge status={row.status} />,
      },
      {
        key: 'language',
        header: 'Language',
        render: (row: Call) => row.language ? <span className="capitalize text-sm">{row.language}</span> : <span className="text-ink-400">—</span>,
      },
      {
        key: 'temperature',
        header: 'Lead',
        render: (row: Call) => <TemperatureBadge temperature={row.leadTemperature} />,
      },
      {
        key: 'duration',
        header: 'Duration',
        render: (row: Call) => <span className="text-sm tabular-nums">{formatDuration(row.duration)}</span>,
      },
      {
        key: 'startTime',
        header: 'Start Time',
        render: (row: Call) => <span className="text-sm text-ink-600">{formatDateTime(row.startTime)}</span>,
      },
      {
        key: 'vapiCallId',
        header: 'Vapi Call ID',
        render: (row: Call) => (
          <span className="font-mono text-xs text-ink-500">{truncate(row.vapiCallId, 20)}</span>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (row: Call) => (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/calls/${row._id ?? row.id ?? row.callId}`); }}
            className="btn-ghost text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Calls"
        description="All outbound calls placed through Vapi."
        actions={
          <>
            <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <PhoneCall className="w-4 h-4" />
              Start Call
            </button>
          </>
        }
      />

      <div className="card p-4 mb-4">
        <FilterBar>
          <SearchInput
            value={params.search ?? ''}
            onChange={(v) => updateParam('search', v)}
            placeholder="Search phone number or Vapi ID…"
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
            value={params.temperature ?? ''}
            onChange={(v) => updateParam('temperature', v)}
            options={TEMP_OPTIONS}
            placeholder="All Temperatures"
            ariaLabel="Filter by temperature"
          />
        </FilterBar>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : isError ? (
        <ErrorState title="Could not load calls" message="The backend may be unreachable. Try refreshing." onRetry={() => refetch()} />
      ) : calls.length === 0 ? (
        <EmptyState
          title="No calls found"
          message="No calls match your filters, or no calls have been made yet. Start an outbound call to see it here."
          action={<button onClick={() => setModalOpen(true)} className="btn-primary"><PhoneCall className="w-4 h-4" /> Start Outbound Call</button>}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={calls}
            rowKey={(row) => row._id ?? row.id ?? row.callId ?? row.phoneNumber}
            onRowClick={(row) => navigate(`/calls/${row._id ?? row.id ?? row.callId}`)}
          />
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={(p) => updateParam('page', p)} />
          </div>
        </>
      )}

      <StartCallModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
