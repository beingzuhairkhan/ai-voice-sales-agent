import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw, Settings as SettingsIcon, Save, Loader2, CheckCircle2, XCircle, Phone, Mail, User } from 'lucide-react';
import { useSettings, useUpdateSettings, useHealth } from '@/hooks/useQueries';
import { useToast } from '@/providers/ToastContext';
import { PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Breadcrumbs, DetailField, DetailGrid } from '@/components/ui/Breadcrumbs';
import { Skeleton, ErrorState } from '@/components/ui/States';
import { extractError } from '@/api/client';
import { cn } from '@/lib/utils';
import type { AppSettings } from '@/types/api';

const settingsSchema = z.object({
  hotScoreThreshold: z.number().min(0).max(100).optional(),
  warmScoreThreshold: z.number().min(0).max(100).optional(),
  callbackDefaultMorningTime: z.string().optional(),
  callbackDefaultAfternoonTime: z.string().optional(),
  callbackDefaultEveningTime: z.string().optional(),
  defaultTimezone: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useSettings();
  const update = useUpdateSettings();
  const health = useHealth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('general');

  const { register, handleSubmit, reset } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  const onSubmit = (values: SettingsForm) => {
    update.mutate(values, {
      onSuccess: () => {
        toast.success('Settings saved', 'The backend has persisted your configuration changes.');
        refetch();
      },
      onError: (err) => toast.error('Save failed', extractError(err)),
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Settings / Configuration" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Settings / Configuration" />
        <ErrorState title="Could not load settings" message="The backend may not expose a settings endpoint, or it is unreachable." onRetry={() => refetch()} />
      </div>
    );
  }

  const s: AppSettings = data ?? {};
  const env = s.apiEnvironment ?? {};

  const providerHealthList = [
    { name: 'Vapi', key: 'vapi', healthy: env.vapi ?? health.data?.vapi },
    { name: 'Sarvam AI', key: 'sarvam', healthy: env.sarvam ?? health.data?.sarvam },
    { name: 'OpenAI', key: 'openai', healthy: env.openai ?? health.data?.openai },
    { name: 'WhatsApp', key: 'whatsapp', healthy: env.whatsapp ?? health.data?.whatsapp },
    { name: 'Google Calendar', key: 'googleCalendar', healthy: env.googleCalendar ?? health.data?.googleCalendar },
    { name: 'MongoDB', key: 'mongodb', healthy: env.mongodb ?? health.data?.mongodb },
    { name: 'Redis', key: 'redis', healthy: env.redis ?? health.data?.redis },
  ];

  return (
    <div>
      <PageHeader
        title="Settings / Configuration"
        description="Safe application configuration and operational settings."
        actions={
          <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
        }
      />

      <Tabs
        items={[
          { id: 'general', label: 'General' },
          { id: 'thresholds', label: 'Thresholds' },
          { id: 'callback', label: 'Callback Times' },
          { id: 'environment', label: 'API Environment' },
          { id: 'edit', label: 'Edit Settings' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-4"
      />

      {activeTab === 'general' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-ink-900">General Configuration</h3>
          </div>
          <DetailGrid>
            <DetailField label="Default Timezone">{s.defaultTimezone ?? '—'}</DetailField>
          </DetailGrid>

          {s.developerContact && (
            <div className="mt-6 pt-4 border-t border-ink-100">
              <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-3">Developer Contact</p>
              <DetailGrid>
                <DetailField label="Name">
                  <span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-ink-400" />{s.developerContact.name ?? '—'}</span>
                </DetailField>
                <DetailField label="Mobile">
                  <span className="inline-flex items-center gap-1.5 font-mono"><Phone className="w-3.5 h-3.5 text-ink-400" />{s.developerContact.mobile ?? '—'}</span>
                </DetailField>
                <DetailField label="Email">
                  <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-ink-400" />{s.developerContact.email ?? '—'}</span>
                </DetailField>
              </DetailGrid>
            </div>
          )}
        </div>
      )}

      {activeTab === 'thresholds' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Lead Classification Thresholds</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-hot-50 border border-hot-100">
              <p className="text-xs font-medium text-hot-700 uppercase tracking-wide">HOT Score Threshold</p>
              <p className="text-2xl font-bold text-hot-600 mt-1 tabular-nums">{s.hotScoreThreshold ?? '—'}</p>
              <p className="text-xs text-hot-700/70 mt-1">Leads with intent score at or above this are classified HOT</p>
            </div>
            <div className="p-4 rounded-lg bg-warm-50 border border-warm-100">
              <p className="text-xs font-medium text-warm-700 uppercase tracking-wide">WARM Score Threshold</p>
              <p className="text-2xl font-bold text-warm-600 mt-1 tabular-nums">{s.warmScoreThreshold ?? '—'}</p>
              <p className="text-xs text-warm-700/70 mt-1">Leads with intent score at or above this are classified WARM</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'callback' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Default Callback Times</h3>
          <DetailGrid>
            <DetailField label="Morning Time">{s.callbackDefaultMorningTime ?? '—'}</DetailField>
            <DetailField label="Afternoon Time">{s.callbackDefaultAfternoonTime ?? '—'}</DetailField>
            <DetailField label="Evening Time">{s.callbackDefaultEveningTime ?? '—'}</DetailField>
            <DetailField label="Timezone">{s.defaultTimezone ?? '—'}</DetailField>
          </DetailGrid>
          <p className="text-xs text-ink-400 mt-4">
            These defaults are used when the backend parses natural-language callback requests like "call me back tomorrow morning".
          </p>
        </div>
      )}

      {activeTab === 'environment' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-ink-900">API Environment Status</h3>
          </div>
          <p className="text-xs text-ink-500 mb-4">
            Provider and service configuration status shown as safe boolean/healthy indicators only. No credentials or secret values are ever displayed.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providerHealthList.map((p) => {
              const isHealthy = p.healthy === true || p.healthy === 'ok' || p.healthy === 'healthy' || p.healthy === 'connected';
              const isConfigured = p.healthy != null && p.healthy !== false;
              return (
                <div key={p.key} className="flex items-center gap-3 p-4 rounded-lg border border-ink-200">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    isHealthy ? 'bg-success-50 text-success-600' : isConfigured ? 'bg-warning-50 text-warning-600' : 'bg-error-50 text-error-600'
                  )}>
                    {isHealthy ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{p.name}</p>
                    <p className={cn(
                      'text-xs',
                      isHealthy ? 'text-success-600' : isConfigured ? 'text-warning-600' : 'text-error-600'
                    )}>
                      {isHealthy ? 'Healthy' : isConfigured ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'edit' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Edit Settings</h3>
          <p className="text-sm text-ink-500 mb-6">
            Only settings supported by the backend are editable here. Changes are persisted by the NestJS backend.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="hotScoreThreshold">HOT Score Threshold (0–100)</label>
                <input id="hotScoreThreshold" type="number" min={0} max={100} {...register('hotScoreThreshold', { valueAsNumber: true })} className="input" defaultValue={s.hotScoreThreshold ?? ''} />
              </div>
              <div>
                <label className="label" htmlFor="warmScoreThreshold">WARM Score Threshold (0–100)</label>
                <input id="warmScoreThreshold" type="number" min={0} max={100} {...register('warmScoreThreshold', { valueAsNumber: true })} className="input" defaultValue={s.warmScoreThreshold ?? ''} />
              </div>
              <div>
                <label className="label" htmlFor="callbackDefaultMorningTime">Callback Morning Time</label>
                <input id="callbackDefaultMorningTime" {...register('callbackDefaultMorningTime')} className="input" defaultValue={s.callbackDefaultMorningTime ?? ''} placeholder="09:00" />
              </div>
              <div>
                <label className="label" htmlFor="callbackDefaultAfternoonTime">Callback Afternoon Time</label>
                <input id="callbackDefaultAfternoonTime" {...register('callbackDefaultAfternoonTime')} className="input" defaultValue={s.callbackDefaultAfternoonTime ?? ''} placeholder="13:00" />
              </div>
              <div>
                <label className="label" htmlFor="callbackDefaultEveningTime">Callback Evening Time</label>
                <input id="callbackDefaultEveningTime" {...register('callbackDefaultEveningTime')} className="input" defaultValue={s.callbackDefaultEveningTime ?? ''} placeholder="17:00" />
              </div>
              <div>
                <label className="label" htmlFor="defaultTimezone">Default Timezone</label>
                <input id="defaultTimezone" {...register('defaultTimezone')} className="input" defaultValue={s.defaultTimezone ?? ''} placeholder="Asia/Kolkata" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={update.isPending} className="btn-primary">
                {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </button>
              <button type="button" onClick={() => reset()} className="btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
