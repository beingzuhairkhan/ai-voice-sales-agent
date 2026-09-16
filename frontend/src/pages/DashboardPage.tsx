import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall, Phone, PhoneOff, Flame, Thermometer, Snowflake,
  Clock, MessageSquare, RefreshCw, ArrowRight, Server, Bot,
  Mic, Brain, Database, Send, Calendar, Zap, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useDashboardOverview } from '@/hooks/useQueries';
import { PageHeader, ChartCard } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { CardSkeleton, ErrorState, EmptyState } from '@/components/ui/States';
import { StartCallModal } from '@/components/StartCallModal';
import { Timeline } from '@/components/ui/Timeline';
import { TemperatureBadge } from '@/components/ui/TemperatureBadge';
import { getActionEventStyle, formatActionLabel } from '@/lib/actionEvents';
import { timeAgo } from '@/lib/utils';
import type { ActionEvent, LeadTemperature } from '@/types/api';

const PIE_COLORS: Record<string, string> = {
  HOT: '#ef4444',
  WARM: '#f59e0b',
  COLD: '#3b82f6',
  UNKNOWN: '#9aa2b4',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  failed: 'Failed',
  in_progress: 'In Progress',
  other: 'Other',
};

// Action event `data` payloads vary by type (trigger/whatsappType/messageLength,
// temperature/intentScore, error, summary, ...). Render whatever's present.
function formatEventData(data?: Record<string, unknown> | null) {
  if (!data) return undefined;
  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return undefined;
  return entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
}

// The overview endpoint returns flat totals (hotLeads/warmLeads/coldLeads), not
// a pre-built `leadDistribution` array — build the chart's shape from them.
function deriveLeadDistribution(d: any) {
  return [
    { temperature: 'HOT', count: d?.hotLeads ?? 0 },
    { temperature: 'WARM', count: d?.warmLeads ?? 0 },
    { temperature: 'COLD', count: d?.coldLeads ?? 0 },
  ].filter((e) => e.count > 0);
}

// Same story for call status — derive from completedCalls/failedCalls/inProgressCalls.
// Any remainder against totalCalls (other statuses the backend doesn't break out
// individually, e.g. no-answer) is bucketed as "other" rather than dropped.
function deriveCallStatusBreakdown(d: any) {
  const completed = d?.completedCalls ?? 0;
  const failed = d?.failedCalls ?? 0;
  const inProgress = d?.inProgressCalls ?? 0;
  const total = d?.totalCalls ?? 0;
  const other = Math.max(0, total - completed - failed - inProgress);
  return [
    { status: 'completed', count: completed },
    { status: 'failed', count: failed },
    { status: 'in_progress', count: inProgress },
    ...(other > 0 ? [{ status: 'other', count: other }] : []),
  ].filter((e) => e.count > 0);
}

function dateKey(iso?: string) {
  if (!iso) return null;
  return iso.slice(0, 10); // YYYY-MM-DD
}

// The overview endpoint doesn't return `callsOverTime`, `whatsappActivity`, or
// `callbackActivity` time series. `recentActivity` does have real, timestamped
// events though, so bucket those by day and action-type family instead of
// showing a chart that's permanently empty. This only reflects the window
// covered by `recentActivity`, not the full history.
function deriveActivityFromRecent(recentActivity: ActionEvent[]) {
  const calls = new Map<string, number>();
  const whatsapp = new Map<string, number>();
  const callbacks = new Map<string, number>();

  recentActivity.forEach((evt) => {
    const type = (evt as any).type ?? evt.actionType ?? '';
    const key = dateKey(evt.createdAt ?? (evt as any).timestamp);
    if (!key) return;
    if (type === 'CALL_STARTED' || type === 'CALL_ENDED') {
      calls.set(key, (calls.get(key) ?? 0) + 1);
    } else if (type.startsWith('WHATSAPP_') || type.startsWith('FOLLOWUP_')) {
      whatsapp.set(key, (whatsapp.get(key) ?? 0) + 1);
    } else if (type.includes('CALLBACK')) {
      callbacks.set(key, (callbacks.get(key) ?? 0) + 1);
    }
  });

  const callsOverTime = Array.from(calls.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    callsOverTime,
    waActivity: Array.from(whatsapp.entries()).map(([date, count]) => ({ date, count })),
    cbActivity: Array.from(callbacks.entries()).map(([date, count]) => ({ date, count })),
  };
}

export function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboardOverview();
  const [callModalOpen, setCallModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard Overview" description="Real-time view of your AI voice sales agent." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load dashboard"
        message="The backend may be unreachable or returned an error. Check your API configuration."
        onRetry={() => refetch()}
      />
    );
  }

  const d = data;
  const recent: ActionEvent[] = d?.recentActivity ?? [];

  const leadDist = deriveLeadDistribution(d);
  const statusBreakdown = deriveCallStatusBreakdown(d);
  const { callsOverTime, waActivity, cbActivity } = deriveActivityFromRecent(recent);

  // API returns `totalCallbacks` / `scheduledCallbacks`, not `callbacks` / `pendingCallbacks`.
  const totalCallbacks = d?.totalCallbacks ?? 0;
  const scheduledCallbacks = d?.scheduledCallbacks ?? 0;

  // API returns `totalWhatsappMessages` (all attempts) plus a real sent/failed
  // breakdown, not a single `whatsappMessages` count.
  const totalWhatsapp = d?.totalWhatsappMessages ?? 0;
  const sentWhatsapp = d?.sentWhatsappMessages ?? 0;
  const failedWhatsapp = d?.failedWhatsappMessages ?? 0;

  return (
    <div>
      <PageHeader
        title="Dashboard Overview"
        description="Real-time view of your AI voice sales agent activity."
        actions={
          <>
            <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => setCallModalOpen(true)} className="btn-primary">
              <PhoneCall className="w-4 h-4" />
              Start Outbound Call
            </button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Calls" value={d?.totalCalls ?? 0} icon={<Phone className="w-5 h-5" />} accent="brand" hint="All outbound calls" />
        <StatCard label="Completed" value={d?.completedCalls ?? 0} icon={<PhoneOff className="w-5 h-5" />} accent="success" hint="Successfully ended calls" />
        <StatCard label="Failed" value={d?.failedCalls ?? 0} icon={<PhoneOff className="w-5 h-5" />} accent="error" hint="Calls that failed" />
        <StatCard label="In Progress" value={d?.inProgressCalls ?? 0} icon={<PhoneCall className="w-5 h-5" />} accent="brand" hint="Active calls right now" />
        <StatCard label="HOT Leads" value={d?.hotLeads ?? 0} icon={<Flame className="w-5 h-5" />} accent="hot" hint="High buying intent" />
        <StatCard label="WARM Leads" value={d?.warmLeads ?? 0} icon={<Thermometer className="w-5 h-5" />} accent="warm" hint="Moderate intent" />
        <StatCard label="COLD Leads" value={d?.coldLeads ?? 0} icon={<Snowflake className="w-5 h-5" />} accent="cold" hint="Low intent" />
        <StatCard label="WhatsApp Sent" value={sentWhatsapp} icon={<CheckCircle2 className="w-5 h-5" />} accent="success" hint={`${totalWhatsapp} total attempts`} />
        <StatCard label="WhatsApp Failed" value={failedWhatsapp} icon={<XCircle className="w-5 h-5" />} accent="error" hint="Delivery failures" />
        <StatCard label="Callbacks" value={totalCallbacks} icon={<Clock className="w-5 h-5" />} accent="cold" hint="Total requested" />
        <StatCard label="Callbacks Scheduled" value={scheduledCallbacks} icon={<Calendar className="w-5 h-5" />} accent="warning" hint={`${Math.max(0, totalCallbacks - scheduledCallbacks)} not yet scheduled`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard
          title="Call Activity"
          description="Calls started/ended, from the recent activity feed"
          isEmpty={callsOverTime.length === 0}
          emptyMessage="No call activity in the recent events feed yet"
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={callsOverTime}>
              <defs>
                <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f80f5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2f80f5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#717a8f' }} />
              <YAxis tick={{ fontSize: 12, fill: '#717a8f' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dde1e9', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#2f80f5" strokeWidth={2} fill="url(#callGrad)" name="Calls" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Lead Temperature Distribution"
          description="HOT / WARM / COLD breakdown"
          isEmpty={leadDist.length === 0}
          emptyMessage="No lead classification data yet"
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={leadDist}
                dataKey="count"
                nameKey="temperature"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={2}
              >
                {leadDist.map((entry) => (
                  <Cell key={entry.temperature} fill={PIE_COLORS[entry.temperature] ?? '#9aa2b4'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dde1e9', fontSize: 12 }} />
              <Legend formatter={(v) => <span style={{ fontSize: 12, color: '#596074' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Call Status Breakdown"
          description="Completed vs failed vs in-progress"
          isEmpty={statusBreakdown.length === 0}
          emptyMessage="No call status breakdown available"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
              <XAxis dataKey="status" tickFormatter={(s) => STATUS_LABELS[s] ?? s} tick={{ fontSize: 11, fill: '#717a8f' }} />
              <YAxis tick={{ fontSize: 12, fill: '#717a8f' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dde1e9', fontSize: 12 }} labelFormatter={(s) => STATUS_LABELS[s as string] ?? s} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#2f80f5" name="Calls" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="WhatsApp & Callback Activity"
          description="From the recent activity feed"
          isEmpty={waActivity.length === 0 && cbActivity.length === 0}
          emptyMessage="No WhatsApp or callback activity in the recent events feed yet"
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mergeActivity(waActivity, cbActivity)}>
              <defs>
                <linearGradient id="waGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#717a8f' }} />
              <YAxis tick={{ fontSize: 12, fill: '#717a8f' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dde1e9', fontSize: 12 }} />
              <Legend formatter={(v) => <span style={{ fontSize: 12, color: '#596074' }}>{v}</span>} />
              <Area type="monotone" dataKey="whatsapp" stroke="#10b981" strokeWidth={2} fill="url(#waGrad)" name="WhatsApp" />
              <Area type="monotone" dataKey="callbacks" stroke="#3b82f6" strokeWidth={2} fill="url(#cbGrad)" name="Callbacks" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* System architecture flow */}
      <ArchitectureFlow />

      {/* Recent activity timeline */}
      <div className="mt-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink-900">Recent Activity</h3>
            <Link to="/activity" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="No recent activity" message="Action events will appear here once calls start." />
          ) : (
            <Timeline
              items={recent.slice(0, 10).map((evt: any) => {
                // API returns `type`, not `actionType`.
                const actionType = evt.type ?? evt.actionType;
                const style = getActionEventStyle(actionType);
                const Icon = style.icon;
                // Context lives under `data` (trigger, whatsappType, error, temperature, ...).
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
                  timestamp: timeAgo(evt.createdAt ?? evt.timestamp),
                  badge: badgeLabel ? (
                    <span className={`text-xs capitalize ${badgeVariant}`}>{badgeLabel}</span>
                  ) : undefined,
                };
              })}
            />
          )}
        </div>
      </div>

      <StartCallModal open={callModalOpen} onClose={() => setCallModalOpen(false)} />
    </div>
  );
}

function mergeActivity(
  wa: Array<{ date: string; count: number }>,
  cb: Array<{ date: string; count: number }>,
) {
  const map = new Map<string, { date: string; whatsapp: number; callbacks: number }>();
  wa.forEach((w) => {
    const e = map.get(w.date) ?? { date: w.date, whatsapp: 0, callbacks: 0 };
    e.whatsapp = w.count;
    map.set(w.date, e);
  });
  cb.forEach((c) => {
    const e = map.get(c.date) ?? { date: c.date, whatsapp: 0, callbacks: 0 };
    e.callbacks = c.count;
    map.set(c.date, e);
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function ArchitectureFlow() {
  const steps = [
    { icon: Zap, label: 'Admin / API', desc: 'Starts outbound call', color: 'bg-brand-50 text-brand-600' },
    { icon: Server, label: 'NestJS', desc: 'Creates call, calls Vapi', color: 'bg-brand-50 text-brand-600' },
    { icon: Phone, label: 'Vapi', desc: 'Dials customer phone', color: 'bg-brand-50 text-brand-600' },
    { icon: Mic, label: 'Sarvam STT/TTS', desc: 'Indian-language speech', color: 'bg-cold-50 text-cold-600' },
    { icon: Brain, label: 'OpenAI', desc: 'Reasoning & LLM', color: 'bg-warm-50 text-warm-600' },
    { icon: Server, label: 'Decision Engine', desc: 'Classifies lead', color: 'bg-brand-50 text-brand-600' },
    { icon: Flame, label: 'HOT / WARM / COLD', desc: 'Temperature result', color: 'bg-hot-50 text-hot-600' },
    { icon: Send, label: 'WhatsApp', desc: 'Mid-call + follow-up', color: 'bg-success-50 text-success-600' },
    { icon: Calendar, label: 'Google Calendar', desc: 'Callback booking', color: 'bg-cold-50 text-cold-600' },
    { icon: Database, label: 'MongoDB', desc: 'Persistent storage', color: 'bg-ink-100 text-ink-600' },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-4 h-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-ink-900">System Architecture Flow</h3>
      </div>
      <p className="text-xs text-ink-500 mb-4">
        The complete lifecycle of a call, from admin initiation to follow-up. The dashboard monitors this flow — it does not execute it.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-ink-800 leading-tight">{step.label}</p>
                  <p className="text-[10px] text-ink-500 leading-tight mt-0.5">{step.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-ink-300 shrink-0 hidden sm:block" />}
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-ink-100">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-ink-500 font-medium">Failure paths:</span>
          {['Vapi', 'Sarvam', 'OpenAI', 'WhatsApp', 'Calendar'].map((p) => (
            <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-error-50 text-error-600 border border-error-100">
              <span className="w-1.5 h-1.5 rounded-full bg-error-500" />
              {p}
            </span>
          ))}
          <span className="text-ink-400">— shown as error indicators in call/lead data when the backend reports them</span>
        </div>
      </div>
    </div>
  );
}