import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Phone, PhoneCall, Clock, Globe, Flame,
  Bot, AlertCircle, ExternalLink, Play, Zap, Server, Radio,
} from 'lucide-react';
import { useCallPolling, useCallTranscript, useCallLead, useCallActions, useCallbacks } from '@/hooks/useQueries';
import { Breadcrumbs, DetailField, DetailGrid } from '@/components/ui/Breadcrumbs';
import { Tabs } from '@/components/ui/Tabs';
import { CallStatusBadge } from '@/components/ui/CallStatusBadge';
import { TemperatureBadge } from '@/components/ui/TemperatureBadge';
import { Badge } from '@/components/ui/Badge';
import { ChatMessage } from '@/components/ui/ChatMessage';
import { Timeline } from '@/components/ui/Timeline';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { LoadingSkeleton, ErrorState, EmptyState, Skeleton } from '@/components/ui/States';
import { getActionEventStyle, formatActionLabel } from '@/lib/actionEvents';
import { formatDateTime, formatDuration, formatPercent, cn } from '@/lib/utils';
import type { Callback, PaginationParams } from '@/types/api';

// The transcript endpoint (and the call record itself) stores the conversation
// as one raw string with "AI:" / "User:" line prefixes, not an array of
// message objects. Parse it into turns so it can feed <ChatMessage>.
function parseTranscript(raw?: string | null) {
  if (!raw) return [] as { id: string; role: 'assistant' | 'user'; content: string }[];
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const messages: { id: string; role: 'assistant' | 'user'; content: string }[] = [];
  lines.forEach((line, i) => {
    const match = line.match(/^(AI|User):\s*(.*)$/);
    if (match) {
      messages.push({ id: `t-${i}`, role: match[1] === 'AI' ? 'assistant' : 'user', content: match[2] });
    } else if (messages.length) {
      // Continuation of the previous turn (no speaker prefix on this line).
      messages[messages.length - 1].content += ' ' + line;
    }
  });
  return messages;
}

// Action event `data` payloads vary by type (phoneNumber, summary, temperature
// + intentScore, trigger, ...). Render whatever keys are present instead of
// assuming a single shape.
function formatEventData(data?: Record<string, unknown> | null) {
  if (!data) return undefined;
  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return undefined;
  return entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
}

function callbackStatusVariant(status?: string): 'success' | 'error' | 'warning' {
  if (status === 'booked' || status === 'completed' || status === 'scheduled') return 'success';
  if (status === 'failed' || status === 'cancelled') return 'error';
  return 'warning'; // requested, pending, etc.
}

export function CallDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  const call = useCallPolling(id);
  const transcript = useCallTranscript(id);
  const lead = useCallLead(id);
  const actions = useCallActions(id);
  const callbackParams: PaginationParams = { page: 1, limit: 50, search: id };
  const callbacks = useCallbacks(callbackParams);

  const isLoading = call.isLoading;
  const isError = call.isError;
  const isActive = call.isActive;

  if (isLoading) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Calls', to: '/calls' }, { label: 'Call Details' }]} />
        <div className="mt-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !call.data) {
    return (
      <div>
        <Breadcrumbs items={[{ label: 'Calls', to: '/calls' }, { label: 'Call Details' }]} />
        <div className="mt-4">
          <ErrorState title="Call not found" message="This call may not exist or the backend is unreachable." />
        </div>
      </div>
    );
  }

  const c = call.data;
  const callId = c._id ?? c.id ?? c.callId;
  const leadData = lead.data;
  const actionEvents = actions.data ?? [];
  // Response shape is `{ callbacks: [...] }`, not a generic paginated `{ data: [...] }`.
  const callCallbacks = callbacks.data?.callbacks ?? callbacks.data?.data ?? [];

  // No `duration` field on the call — derive it from start/end when both exist.
  const durationSeconds = c.duration ?? (c.startTime && c.endTime
    ? Math.max(0, Math.round((new Date(c.endTime).getTime() - new Date(c.startTime).getTime()) / 1000))
    : undefined);

  // No `leadTemperature` on the call itself — it lives on the lead record.
  const leadTemperature = c.leadTemperature ?? leadData?.temperature;

  // The transcript endpoint returns { callId, transcript: "AI: ... \nUser: ...", language },
  // a single raw string — not an array of messages.
  const transcriptMessages = parseTranscript(transcript.data?.transcript ?? c.transcript);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'transcript', label: 'Transcript', badge: transcriptMessages.length > 0 ? <Badge variant="neutral">{transcriptMessages.length}</Badge> : undefined },
    { id: 'lead', label: 'Lead Info' },
    { id: 'actions', label: 'Actions', badge: actionEvents.length > 0 ? <Badge variant="neutral">{actionEvents.length}</Badge> : undefined },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'callback', label: 'Callback' },
    { id: 'technical', label: 'Technical' },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Calls', to: '/calls' }, { label: `Call ${formatDateTime(c.startTime)}` }]} />

      <div className="flex items-center justify-between mt-3 mb-4">
        <Link to="/calls" className="btn-ghost text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Calls
        </Link>
        <button onClick={() => { call.refetch(); transcript.refetch(); lead.refetch(); actions.refetch(); }} className="btn-secondary" disabled={call.isFetching}>
          <RefreshCw className={cn('w-4 h-4', call.isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Call header */}
      <div className="card p-5 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', isActive ? 'bg-success-50 text-success-600' : 'bg-ink-100 text-ink-500')}>
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-lg font-bold text-ink-900 font-mono">{c.phoneNumber}</p>
                <CallStatusBadge status={c.status} pulse={isActive} />
                {leadTemperature && <TemperatureBadge temperature={leadTemperature} size="md" />}
              </div>
              <p className="text-sm text-ink-500 mt-1">
                Call ID: <span className="font-mono text-xs">{callId}</span>
                {c.vapiCallId && <> · Vapi: <span className="font-mono text-xs">{c.vapiCallId}</span></>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-ink-600">
              <Clock className="w-4 h-4" />
              {durationSeconds != null ? formatDuration(durationSeconds) : '—'}
            </div>
            {c.language && c.language !== 'unknown' && (
              <div className="flex items-center gap-1.5 text-ink-600">
                <Globe className="w-4 h-4" />
                <span className="capitalize">{c.language}</span>
              </div>
            )}
          </div>
        </div>

        {isActive && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-success-50 border border-success-100">
            <Radio className="w-5 h-5 text-success-600 shrink-0 animate-pulse" />
            <p className="text-sm text-success-800">
              This call is currently active. The voice conversation is happening through Vapi — the dashboard is monitoring backend state.
            </p>
          </div>
        )}

        {c.providerError && (
          <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-error-50 border border-error-100">
            <AlertCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-error-800">Provider Error</p>
              <p className="text-sm text-error-700 mt-0.5 font-mono break-all">{c.providerError}</p>
            </div>
          </div>
        )}

        {c.error && !c.providerError && (
          <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-error-50 border border-error-100">
            <AlertCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-error-800">Error</p>
              <p className="text-sm text-error-700 mt-0.5 font-mono break-all">{c.error}</p>
            </div>
          </div>
        )}
      </div>

      <Tabs items={tabs} active={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="card p-6">
          <DetailGrid>
            <DetailField label="Phone Number"><span className="font-mono">{c.phoneNumber}</span></DetailField>
            <DetailField label="Internal Call ID"><span className="font-mono text-xs break-all">{callId}</span></DetailField>
            <DetailField label="Vapi Call ID"><span className="font-mono text-xs break-all">{c.vapiCallId ?? 'Pending'}</span></DetailField>
            <DetailField label="Status"><CallStatusBadge status={c.status} /></DetailField>
            <DetailField label="Language">{c.language && c.language !== 'unknown' ? <span className="capitalize">{c.language}</span> : '—'}</DetailField>
            <DetailField label="Lead Temperature">{leadTemperature ? <TemperatureBadge temperature={leadTemperature} /> : '—'}</DetailField>
            <DetailField label="Start Time">{formatDateTime(c.startTime)}</DetailField>
            <DetailField label="End Time">{formatDateTime(c.endTime)}</DetailField>
            <DetailField label="Duration">{durationSeconds != null ? formatDuration(durationSeconds) : '—'}</DetailField>
            <DetailField label="Follow-up Status">{c.followUpStatus ?? '—'}</DetailField>
          </DetailGrid>

          {c.recordingUrl && (
            <div className="mt-6 pt-4 border-t border-ink-100">
              <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Recording</p>
              <div className="flex items-center gap-3">
                <audio controls className="w-full max-w-md">
                  <source src={c.recordingUrl} />
                </audio>
                <a href={c.recordingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                  <ExternalLink className="w-3 h-3" />
                  Open
                </a>
              </div>
            </div>
          )}

          {/* Real-time snapshot for active calls */}
          {isActive && (
            <div className="mt-6 pt-4 border-t border-ink-100">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-brand-600" />
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">Live Snapshot</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-ink-50">
                  <p className="text-xs text-ink-500">Transcript Messages</p>
                  <p className="text-lg font-semibold text-ink-900">{transcriptMessages.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-ink-50">
                  <p className="text-xs text-ink-500">Action Events</p>
                  <p className="text-lg font-semibold text-ink-900">{actionEvents.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-ink-50">
                  <p className="text-xs text-ink-500">Lead Temperature</p>
                  <div className="mt-1">{leadTemperature ? <TemperatureBadge temperature={leadTemperature} size="md" /> : <span className="text-sm text-ink-400">—</span>}</div>
                </div>
              </div>
              {actionEvents.some((e) => e.type === 'HOT_DETECTED') && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-hot-50 border border-hot-100">
                  <Flame className="w-5 h-5 text-hot-600" />
                  <p className="text-sm font-semibold text-hot-700">HOT lead detected during this call</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transcript tab */}
      {activeTab === 'transcript' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-ink-900">Conversation Transcript</h3>
            </div>
            <button onClick={() => transcript.refetch()} className="btn-ghost text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
          {transcript.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : transcript.isError ? (
            <ErrorState title="Could not load transcript" onRetry={() => transcript.refetch()} />
          ) : transcriptMessages.length === 0 ? (
            <EmptyState title="No transcript yet" message="The transcript will appear here once the backend has conversation text stored." />
          ) : (
            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2">
              {transcriptMessages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lead tab */}
      {activeTab === 'lead' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink-900">Lead Extraction & Classification</h3>
            {leadData && <TemperatureBadge temperature={leadData.temperature} size="md" />}
          </div>
          {lead.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : lead.isError ? (
            <ErrorState title="Could not load lead information" onRetry={() => lead.refetch()} />
          ) : !leadData ? (
            <EmptyState title="No lead data yet" message="Lead extraction information will appear here once the backend has processed the conversation." />
          ) : (
          <>
            <DetailGrid>
              <DetailField label="Customer Name">{leadData.customerName ?? leadData.name ?? '—'}</DetailField>
              <DetailField label="Phone Number"><span className="font-mono">{leadData.phoneNumber ?? '—'}</span></DetailField>
              <DetailField label="Temperature"><TemperatureBadge temperature={leadData.temperature} /></DetailField>
              <DetailField label="Intent Score">{leadData.intentScore != null ? `${leadData.intentScore}/100` : '—'}</DetailField>
              <DetailField label="Confidence">{leadData.confidence != null ? formatPercent(leadData.confidence) : '—'}</DetailField>
              <DetailField label="Budget">{leadData.budget != null ? `${leadData.currency ?? ''}${leadData.budget.toLocaleString()}` : '—'}</DetailField>
              <DetailField label="Product Description">{leadData.productDescription ?? '—'}</DetailField>
              <DetailField label="Product Count">{leadData.productCount ?? '—'}</DetailField>
              <DetailField label="Timeline">{leadData.timeline ?? '—'}</DetailField>
              {/* API returns `isDecisionMaker`, not `decisionMaker` */}
              <DetailField label="Decision Maker">{(leadData.isDecisionMaker ?? leadData.decisionMaker) == null ? '—' : (leadData.isDecisionMaker ?? leadData.decisionMaker) ? 'Yes' : 'No'}</DetailField>
            </DetailGrid>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Required Features</p>
                {leadData.requiredFeatures?.length ? (
                  <div className="flex flex-wrap gap-1.5">{leadData.requiredFeatures.map((f, i) => <Badge key={i} variant="info">{f}</Badge>)}</div>
                ) : <p className="text-sm text-ink-400">—</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Pain Points</p>
                {leadData.painPoints?.length ? (
                  <div className="flex flex-wrap gap-1.5">{leadData.painPoints.map((p, i) => <Badge key={i} variant="warning">{p}</Badge>)}</div>
                ) : <p className="text-sm text-ink-400">—</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Barriers</p>
                {leadData.barriers?.length ? (
                  <div className="flex flex-wrap gap-1.5">{leadData.barriers.map((b, i) => <Badge key={i} variant="error">{b}</Badge>)}</div>
                ) : <p className="text-sm text-ink-400">—</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Objections</p>
                {leadData.objections?.length ? (
                  <div className="flex flex-wrap gap-1.5">{leadData.objections.map((o, i) => <Badge key={i} variant="error">{o}</Badge>)}</div>
                ) : <p className="text-sm text-ink-400">—</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Buying Signals</p>
                {leadData.buyingSignals?.length ? (
                  <div className="flex flex-wrap gap-1.5">{leadData.buyingSignals.map((s, i) => <Badge key={i} variant="success">{s}</Badge>)}</div>
                ) : <p className="text-sm text-ink-400">—</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Evidence</p>
                {leadData.evidence?.length ? (
                  <div className="flex flex-wrap gap-1.5">{leadData.evidence.map((e, i) => <Badge key={i} variant="info">{e}</Badge>)}</div>
                ) : <p className="text-sm text-ink-400">—</p>}
              </div>
            </div>

            {/* API returns `reasoning`, not `reason` / `classificationReason` */}
            {(leadData.reasoning ?? leadData.reason ?? leadData.classificationReason) && (
              <div className="mt-6 p-4 rounded-lg bg-ink-50 border border-ink-200">
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-1">Classification Reason</p>
                <p className="text-sm text-ink-700">{leadData.reasoning ?? leadData.reason ?? leadData.classificationReason}</p>
              </div>
            )}

            {/* API returns `rawAiExtraction`, not `rawExtraction` */}
            {(leadData.rawAiExtraction ?? leadData.rawExtraction) && (
              <div className="mt-6">
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Raw AI Extraction</p>
                <JsonViewer data={leadData.rawAiExtraction ?? leadData.rawExtraction} />
              </div>
            )}
          </>
          )}
        </div>
      )}

      {/* Actions tab */}
      {activeTab === 'actions' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink-900">Action Events Timeline</h3>
            <button onClick={() => actions.refetch()} className="btn-ghost text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
          {actions.isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : actions.isError ? (
            <ErrorState title="Could not load actions" onRetry={() => actions.refetch()} />
          ) : actionEvents.length === 0 ? (
            <EmptyState title="No actions recorded" message="Action events will appear here as the call progresses." />
          ) : (
            <Timeline
              items={actionEvents.map((evt) => {
                // API returns `type`, not `actionType`.
                const actionType = evt.type ?? evt.actionType;
                const style = getActionEventStyle(actionType);
                const Icon = style.icon;
                // API nests context under `data` (phoneNumber, summary, temperature, trigger, ...).
                const subtitle = formatEventData(evt.data) ?? evt.phoneNumber ?? undefined;
                // API returns a `success` boolean, not a `status` string.
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
      )}

      {/* WhatsApp tab */}
      {activeTab === 'whatsapp' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-2">WhatsApp Messages</h3>
          <p className="text-sm text-ink-500 mb-4">
            WhatsApp messages triggered during or after this call. Mid-call HOT messages are sent immediately when high buying intent is detected; follow-up messages are sent after the call ends.
          </p>
          <div className="space-y-3">
            <EmptyState
              title="WhatsApp messages linked by call ID"
              message="Use the WhatsApp page to see all messages. Messages associated with this call will appear here when the backend returns them with this call's reference."
              action={<Link to="/whatsapp" className="btn-secondary text-xs">View All WhatsApp Messages</Link>}
            />
          </div>
        </div>
      )}

      {/* Callback tab */}
      {activeTab === 'callback' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Callback Information</h3>
          {callbacks.isLoading ? (
            <LoadingSkeleton rows={2} />
          ) : callCallbacks.length === 0 ? (
            <EmptyState title="No callback for this call" message="If the customer requested a callback during the call, it will appear here once the backend books it." />
          ) : (
            <div className="space-y-4">
              {callCallbacks.map((cb: Callback) => (
                <div key={cb._id ?? cb.id} className="p-4 rounded-lg border border-ink-200">
                  <DetailGrid>
                    <DetailField label="Reason">{cb.reason ?? cb.requestedText ?? '—'}</DetailField>
                    {/* API returns `requestedTimePhrase` and `parsedDateTime`, not `scheduledTime` / `parsedTime` */}
                    <DetailField label="Requested Time">{cb.requestedTimePhrase ? formatDateTime(cb.requestedTimePhrase) : '—'}</DetailField>
                    <DetailField label="Scheduled Time">{cb.parsedDateTime ? formatDateTime(cb.parsedDateTime) : '—'}</DetailField>
                    <DetailField label="Timezone">{cb.timezone ?? '—'}</DetailField>
                    <DetailField label="Confidence">{cb.confidence != null ? formatPercent(cb.confidence) : '—'}</DetailField>
                    <DetailField label="Status"><Badge variant={callbackStatusVariant(cb.status)}>{cb.status}</Badge></DetailField>
                    {/* API returns `googleCalendarEventId`, not `googleEventId` / `calendarEventId` */}
                    <DetailField label="Google Calendar Event ID"><span className="font-mono text-xs">{cb.googleCalendarEventId ?? cb.googleEventId ?? cb.calendarEventId ?? '—'}</span></DetailField>
                  </DetailGrid>
                  {cb.notes && (
                    <p className="text-xs text-ink-500 mt-3 break-all">{cb.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Technical tab */}
      {activeTab === 'technical' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Technical Details</h3>
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-brand-50 border border-brand-100">
            <Server className="w-4 h-4 text-brand-600 shrink-0" />
            <p className="text-sm text-brand-800">This call is processed by the NestJS backend through Vapi. The dashboard only monitors reported state.</p>
          </div>
          <DetailGrid>
            <DetailField label="Internal Call ID"><span className="font-mono text-xs break-all">{callId}</span></DetailField>
            <DetailField label="Vapi Call ID"><span className="font-mono text-xs break-all">{c.vapiCallId ?? '—'}</span></DetailField>
            <DetailField label="Vapi Assistant ID"><span className="font-mono text-xs break-all">{c.metadata?.assistantId ?? '—'}</span></DetailField>
            <DetailField label="Status"><CallStatusBadge status={c.status} /></DetailField>
            <DetailField label="Follow-up Status">{c.followUpStatus ?? '—'}</DetailField>
            <DetailField label="Created At">{formatDateTime(c.createdAt)}</DetailField>
            <DetailField label="Updated At">{formatDateTime(c.updatedAt)}</DetailField>
            <DetailField label="Recording URL">{c.recordingUrl ? <a href={c.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-xs">Available</a> : 'Not available'}</DetailField>
          </DetailGrid>
          {c.providerError && (
            <div className="mt-4">
              <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Provider Error</p>
              <pre className="p-3 text-xs font-mono text-error-700 bg-error-50 rounded-lg border border-error-100 overflow-x-auto">{c.providerError}</pre>
            </div>
          )}
          {c.error && (
            <div className="mt-4">
              <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Error</p>
              <pre className="p-3 text-xs font-mono text-error-700 bg-error-50 rounded-lg border border-error-100 overflow-x-auto">{c.error}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}