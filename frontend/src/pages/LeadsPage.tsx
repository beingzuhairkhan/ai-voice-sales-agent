import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, Flame, TrendingUp } from 'lucide-react';
import { useLeads } from '@/hooks/useQueries';
import { PageHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select, FilterBar } from '@/components/ui/Select';
import { TemperatureBadge } from '@/components/ui/TemperatureBadge';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/States';
import { formatDateTime, formatPercent, truncate, cn } from '@/lib/utils';
import type { Lead, PaginationParams } from '@/types/api';

const TEMP_OPTIONS = [
  { label: 'HOT', value: 'HOT' },
  { label: 'WARM', value: 'WARM' },
  { label: 'COLD', value: 'COLD' },
];

export function LeadsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    search: '',
    temperature: '',
  });

  const { data, isLoading, isError, refetch, isFetching } = useLeads(params);

  const updateParam = (key: keyof PaginationParams, value: string | number) => {
    setParams((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  const leads = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const page = data?.page ?? 1;
  const limit = data?.limit ?? 10;

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (row: Lead) => (
          <span className="font-medium text-ink-900">{row.customerName ?? row.name ?? 'Unknown'}</span>
        ),
      },
      {
        key: 'phoneNumber',
        header: 'Phone',
        render: (row: Lead) => <span className="font-mono text-sm">{row.phoneNumber ?? '—'}</span>,
      },
      {
        key: 'temperature',
        header: 'Temperature',
        render: (row: Lead) => <TemperatureBadge temperature={row.temperature} />,
      },
      {
        key: 'intentScore',
        header: 'Intent',
        render: (row: Lead) => (
          <span className="inline-flex items-center gap-1 text-sm tabular-nums">
            <TrendingUp className="w-3.5 h-3.5 text-ink-400" />
            {row.intentScore != null ? `${row.intentScore}/100` : '—'}
          </span>
        ),
      },
      {
        key: 'confidence',
        header: 'Confidence',
        render: (row: Lead) => <span className="text-sm tabular-nums">{row.confidence != null ? formatPercent(row.confidence) : '—'}</span>,
      },
      {
        key: 'budget',
        header: 'Budget',
        render: (row: Lead) => (
          <span className="text-sm">{row.budget != null ? `${row.currency ?? ''}${row.budget}` : '—'}</span>
        ),
      },
      {
        key: 'productDescription',
        header: 'Product',
        render: (row: Lead) => <span className="text-sm text-ink-600">{truncate(row.productDescription, 30)}</span>,
      },
      {
        key: 'decisionMaker',
        header: 'Decision Maker',
        render: (row: Lead) => (
          row.decisionMaker == null ? <span className="text-ink-400">—</span> :
          row.decisionMaker ? <span className="text-xs font-medium text-success-700">Yes</span> : <span className="text-xs font-medium text-ink-500">No</span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (row: Lead) => <span className="text-sm text-ink-600">{formatDateTime(row.createdAt)}</span>,
      },
      {
        key: 'actions',
        header: '',
        render: (row: Lead) => (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/leads/${row._id ?? row.id}`); }}
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
        title="Leads"
        description="Customer leads qualified by the AI agent as HOT, WARM, or COLD."
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
            placeholder="Search name or phone…"
            className="w-full sm:w-64"
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
        <TableSkeleton rows={6} cols={9} />
      ) : isError ? (
        <ErrorState title="Could not load leads" message="The backend may be unreachable. Try refreshing." onRetry={() => refetch()} />
      ) : leads.length === 0 ? (
        <EmptyState title="No leads found" message="No leads match your filters, or no leads have been qualified yet. Leads are created automatically as calls are processed." />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={leads}
            rowKey={(row) => row._id ?? row.id ?? row.phoneNumber ?? Math.random().toString()}
            onRowClick={(row) => navigate(`/leads/${row._id ?? row.id}`)}
            className={cn(leads.some((l) => l.temperature === 'HOT') && 'ring-1 ring-hot-100')}
          />
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={(p) => updateParam('page', p)} />
          </div>
        </>
      )}

      {leads.some((l) => l.temperature === 'HOT') && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-hot-50 border border-hot-100">
          <Flame className="w-4 h-4 text-hot-600" />
          <p className="text-sm text-hot-700">HOT leads are highlighted — these represent the highest buying intent detected by the AI agent.</p>
        </div>
      )}
    </div>
  );
}
