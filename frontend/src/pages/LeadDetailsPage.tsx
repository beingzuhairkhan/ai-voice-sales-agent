import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Phone, Flame, TrendingUp, FileText, MessageCircle } from 'lucide-react';
import { useLead, useCallActions } from '@/hooks/useQueries';
import { Breadcrumbs, DetailField, DetailGrid } from '@/components/ui/Breadcrumbs';
import { TemperatureBadge } from '@/components/ui/TemperatureBadge';
import { Badge } from '@/components/ui/Badge';
import { Timeline } from '@/components/ui/Timeline';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { Skeleton, ErrorState, EmptyState, LoadingSkeleton } from '@/components/ui/States';
import { getActionEventStyle, formatActionLabel } from '@/lib/actionEvents';
import { formatDateTime, formatPercent, cn } from '@/lib/utils';

export function LeadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const lead = useLead(id);
  const actions = useCallActions(lead.data?.callId);

  if (lead.isLoading) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Leads', to: '/leads' }, { label: 'Lead Details' }]} />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (lead.isError || !lead.data) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Leads', to: '/leads' }, { label: 'Lead Details' }]} />
        <div className="mt-4">
          <ErrorState title="Lead not found" message="This lead may not exist or the backend is unreachable." />
        </div>
      </div>
    );
  }

  const l = lead.data;
  const actionEvents = actions.data ?? [];

  // The API returns `reasoning` (top-level classification rationale). Some older
  // records may still use `reason` / `classificationReason`, so fall back gracefully.
  const classificationReason = l.reasoning ?? l.reason ?? l.classificationReason;

  // The API returns `isDecisionMaker`, not `decisionMaker`.
  const decisionMaker = l.isDecisionMaker ?? l.decisionMaker;

  // The API returns `rawAiExtraction`, not `rawExtraction`.
  const rawExtraction = l.rawAiExtraction ?? l.rawExtraction;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Leads', to: '/leads' }, { label: l.customerName ?? l.name ?? l.phoneNumber ?? 'Lead' }]} />

      <div className="flex items-center justify-between mt-3 mb-4">
        <Link to="/leads" className="btn-ghost text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <button onClick={() => lead.refetch()} className="btn-secondary" disabled={lead.isFetching}>
          <RefreshCw className={cn('w-4 h-4', lead.isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Header card */}
      <div className="card p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
              l.temperature === 'HOT' ? 'bg-hot-50 text-hot-600' :
              l.temperature === 'WARM' ? 'bg-warm-50 text-warm-600' :
              l.temperature === 'COLD' ? 'bg-cold-50 text-cold-600' :
              'bg-ink-100 text-ink-500'
            )}>
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-900">{l.customerName ?? l.name ?? 'Unknown Customer'}</h2>
              {l.phoneNumber && (
                <p className="text-sm text-ink-500 font-mono flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  {l.phoneNumber}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {l.hotWhatsappSent && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium text-success-700 bg-success-50 border border-success-200 rounded-full px-2.5 py-1"
                title="A hot-lead WhatsApp alert was sent for this lead"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp Sent
              </span>
            )}
            <TemperatureBadge temperature={l.temperature} size="md" />
            {l.intentScore != null && (
              <div className="text-right">
                <p className="text-xs text-ink-500">Intent Score</p>
                <p className="text-lg font-bold text-ink-900 tabular-nums flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  {l.intentScore}/100
                </p>
              </div>
            )}
          </div>
        </div>
        {classificationReason && (
          <div className="mt-4 p-3 rounded-lg bg-ink-50 border border-ink-200">
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Classification Reason</p>
            <p className="text-sm text-ink-700">{classificationReason}</p>
          </div>
        )}
      </div>

      {/* Qualification details */}
      <div className="card p-6 mb-4">
        <h3 className="text-sm font-semibold text-ink-900 mb-4">Customer Qualification</h3>
        <DetailGrid>
          <DetailField label="Customer Name">{l.customerName ?? l.name ?? '—'}</DetailField>
          <DetailField label="Phone Number"><span className="font-mono">{l.phoneNumber ?? '—'}</span></DetailField>
          <DetailField label="Temperature"><TemperatureBadge temperature={l.temperature} /></DetailField>
          <DetailField label="Intent Score">{l.intentScore != null ? `${l.intentScore}/100` : '—'}</DetailField>
          <DetailField label="Confidence">{l.confidence != null ? formatPercent(l.confidence) : '—'}</DetailField>
          <DetailField label="Budget">{l.budget != null ? `${l.currency ?? ''}${l.budget.toLocaleString()}` : '—'}</DetailField>
          <DetailField label="Currency">{l.currency ?? '—'}</DetailField>
          <DetailField label="Product Description">{l.productDescription ?? '—'}</DetailField>
          <DetailField label="Product Count">{l.productCount ?? '—'}</DetailField>
          <DetailField label="Timeline">{l.timeline ?? '—'}</DetailField>
          <DetailField label="Decision Maker">{decisionMaker == null ? '—' : decisionMaker ? 'Yes' : 'No'}</DetailField>
          <DetailField label="Language">{l.language ?? '—'}</DetailField>
          <DetailField label="Created At">{formatDateTime(l.createdAt)}</DetailField>
          <DetailField label="Last Updated">{formatDateTime(l.updatedAt)}</DetailField>
        </DetailGrid>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Required Features</p>
            {l.requiredFeatures?.length ? (
              <div className="flex flex-wrap gap-1.5">{l.requiredFeatures.map((f, i) => <Badge key={i} variant="info">{f}</Badge>)}</div>
            ) : <p className="text-sm text-ink-400">—</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Pain Points</p>
            {l.painPoints?.length ? (
              <div className="flex flex-wrap gap-1.5">{l.painPoints.map((p, i) => <Badge key={i} variant="warning">{p}</Badge>)}</div>
            ) : <p className="text-sm text-ink-400">—</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Barriers</p>
            {l.barriers?.length ? (
              <div className="flex flex-wrap gap-1.5">{l.barriers.map((b, i) => <Badge key={i} variant="error">{b}</Badge>)}</div>
            ) : <p className="text-sm text-ink-400">—</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Objections</p>
            {l.objections?.length ? (
              <div className="flex flex-wrap gap-1.5">{l.objections.map((o, i) => <Badge key={i} variant="error">{o}</Badge>)}</div>
            ) : <p className="text-sm text-ink-400">—</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Buying Signals</p>
            {l.buyingSignals?.length ? (
              <div className="flex flex-wrap gap-1.5">{l.buyingSignals.map((s, i) => <Badge key={i} variant="success">{s}</Badge>)}</div>
            ) : <p className="text-sm text-ink-400">—</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Evidence</p>
            {l.evidence?.length ? (
              <div className="flex flex-wrap gap-1.5">{l.evidence.map((e, i) => <Badge key={i} variant="info">{e}</Badge>)}</div>
            ) : <p className="text-sm text-ink-400">—</p>}
          </div>
        </div>
      </div>

      {/* Related records */}
      {l.callId && (
        <div className="card p-5 mb-4">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Related Records</h3>
          <div className="flex flex-wrap gap-2">
            <Link to={`/calls/${l.callId}`} className="btn-secondary text-xs">
              <FileText className="w-3.5 h-3.5" />
              View Associated Call
            </Link>
            <Link to="/whatsapp" className="btn-secondary text-xs">
              WhatsApp Messages
            </Link>
            <Link to="/callbacks" className="btn-secondary text-xs">
              Callbacks
            </Link>
          </div>
        </div>
      )}

      {/* Action timeline */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-ink-900 mb-4">Lead Action Timeline</h3>
        {actions.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : actionEvents.length === 0 ? (
          <EmptyState title="No actions recorded" message="Actions related to this lead will appear here." />
        ) : (
          <Timeline
            items={actionEvents.map((evt) => {
              // The API returns `type`, not `actionType`.
              const actionType = evt.type ?? evt.actionType;
              const style = getActionEventStyle(actionType);
              const Icon = style.icon;
              // Phone number and other context live inside `data`, not top-level.
              const subtitle = evt.data?.phoneNumber ?? evt.phoneNumber ?? undefined;
              // The API returns a `success` boolean, not a `status` string.
              const badgeLabel = evt.status ?? (evt.success == null ? undefined : evt.success ? 'Success' : 'Failed');
              const badgeVariant = evt.success === false ? 'text-hot-600' : 'text-ink-500';
              return {
                id: evt._id ?? evt.id ?? actionType + (evt.createdAt ?? ''),
                icon: <Icon className="w-4 h-4" />,
                color: style.color,
                title: formatActionLabel(actionType),
                subtitle,
                timestamp: formatDateTime(evt.createdAt ?? evt.timestamp),
                badge: badgeLabel ? <span className={cn('text-xs capitalize', badgeVariant)}>{badgeLabel}</span> : undefined,
              };
            })}
          />
        )}
      </div>

      {rawExtraction && (
        <div className="card p-6 mt-4">
          <h3 className="text-sm font-semibold text-ink-900 mb-3">Raw AI Extraction</h3>
          <JsonViewer data={rawExtraction} defaultExpanded />
        </div>
      )}
    </div>
  );
}