import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw, Bot, Mic, Brain, Phone, Globe, Wrench, Save, Loader2, Server, Zap } from 'lucide-react';
import { useAgentConfiguration, useUpdateAgentConfiguration } from '@/hooks/useQueries';
import { useToast } from '@/providers/ToastContext';
import { PageHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Breadcrumbs, DetailField, DetailGrid } from '@/components/ui/Breadcrumbs';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { extractError } from '@/api/client';
import { cn } from '@/lib/utils';
import type { AgentConfiguration } from '@/types/api';

const configSchema = z.object({
  assistantName: z.string().optional(),
  firstMessage: z.string().optional(),
  languageBehavior: z.string().optional(),
});

type ConfigForm = z.infer<typeof configSchema>;

export function AgentConfigPage() {
  const { data, isLoading, isError, refetch, isFetching } = useAgentConfiguration();
  const update = useUpdateAgentConfiguration();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const { register, handleSubmit, reset } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
  });

  const onSubmit = (values: ConfigForm) => {
    update.mutate(values, {
      onSuccess: () => {
        toast.success('Configuration updated', 'The agent configuration has been saved by the backend.');
        refetch();
      },
      onError: (err) => toast.error('Update failed', extractError(err)),
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Agent / Voice Configuration" />
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
        <PageHeader title="Agent / Voice Configuration" />
        <ErrorState title="Could not load configuration" message="The backend may not expose a configuration endpoint, or it is unreachable." onRetry={() => refetch()} />
      </div>
    );
  }

  const cfg: AgentConfiguration = data ?? {};

  const providerCards = [
    { icon: Phone, name: 'Vapi', role: 'Voice Agent & Telephony', desc: 'Primary voice-agent and telephony orchestration layer. Places outbound calls and handles realtime voice conversation.', color: 'bg-brand-50 text-brand-600' },
    { icon: Mic, name: 'Sarvam AI', role: 'Indian-Language Speech', desc: 'STT/TTS for Telugu, Hindi, and English where configured by the backend.', color: 'bg-cold-50 text-cold-600' },
    { icon: Brain, name: 'OpenAI', role: 'Reasoning / LLM', desc: 'Primary LLM for conversation understanding and lead extraction.', color: 'bg-warm-50 text-warm-600' },
    { icon: Brain, name: cfg.fallbackLlmProvider ?? 'Groq / Llama', role: 'Fallback LLM', desc: 'Optional fallback reasoning layer where configured.', color: 'bg-ink-100 text-ink-600' },
  ];

  return (
    <div>
      <PageHeader
        title="Agent / Voice Configuration"
        description="Voice agent provider configuration managed by the NestJS backend."
        actions={
          <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
        }
      />

      <Tabs
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'edit', label: 'Edit Configuration' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-4"
      />

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Provider architecture */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-ink-900">Provider Architecture</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {providerCards.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.name} className="p-4 rounded-lg border border-ink-200">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', p.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                    <p className="text-xs text-ink-500 mb-2">{p.role}</p>
                    <p className="text-xs text-ink-600">{p.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-ink-50 border border-ink-100">
              <p className="text-xs text-ink-500">
                <Server className="w-3 h-3 inline mr-1" />
                All provider operations go through the NestJS backend. The frontend never calls Vapi, Sarvam, OpenAI, or WhatsApp directly. API keys are never exposed in this dashboard.
              </p>
            </div>
          </div>

          {/* Configuration details */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-ink-900">Assistant Configuration</h3>
            </div>
            <DetailGrid>
              <DetailField label="Assistant Name">{cfg.assistantName ?? '—'}</DetailField>
              <DetailField label="Assistant ID"><span className="font-mono text-xs">{cfg.assistantId ?? '—'}</span></DetailField>
              <DetailField label="Phone Number"><span className="font-mono">{cfg.phoneNumber ?? '—'}</span></DetailField>
              <DetailField label="Voice Provider">{cfg.voiceProvider ?? '—'}</DetailField>
              <DetailField label="Transcriber Provider">{cfg.transcriberProvider ?? '—'}</DetailField>
              <DetailField label="LLM Provider">{cfg.llmProvider ?? '—'}</DetailField>
              <DetailField label="Fallback LLM">{cfg.fallbackLlmProvider ?? 'Not configured'}</DetailField>
              <DetailField label="Model">{cfg.model ?? '—'}</DetailField>
              <DetailField label="Voice">{cfg.voice ?? '—'}</DetailField>
            </DetailGrid>

            {/* Languages */}
            <div className="mt-6">
              <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Supported Languages
              </p>
              {cfg.languages?.length ? (
                <div className="flex flex-wrap gap-2">
                  {cfg.languages.map((lang) => (
                    <Badge key={lang} variant="info" className="capitalize">{lang}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-400">—</p>
              )}
            </div>

            {/* Language behavior */}
            {cfg.languageBehavior && (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">Language Behavior</p>
                <p className="text-sm text-ink-700 p-3 rounded-lg bg-ink-50 border border-ink-200">{cfg.languageBehavior}</p>
              </div>
            )}

            {/* First message */}
            {cfg.firstMessage && (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">First Message</p>
                <p className="text-sm text-ink-700 p-3 rounded-lg bg-ink-50 border border-ink-200 italic">"{cfg.firstMessage}"</p>
              </div>
            )}

            {/* System prompt */}
            {cfg.systemPrompt && (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2">System Prompt</p>
                <p className="text-sm text-ink-700 p-3 rounded-lg bg-ink-50 border border-ink-200 whitespace-pre-wrap max-h-64 overflow-y-auto">{cfg.systemPrompt}</p>
              </div>
            )}

            {/* Tools */}
            {cfg.tools?.length && (
              <div className="mt-4">
                <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  Available Backend Tools
                </p>
                <div className="flex flex-wrap gap-2">
                  {cfg.tools.map((tool) => (
                    <Badge key={tool} variant="success">{tool}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'edit' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-ink-900">Edit Non-Secret Configuration</h3>
          </div>
          <p className="text-sm text-ink-500 mb-6">
            Only non-secret configuration is editable here. All provider API keys remain in the NestJS backend and are never exposed or editable from this dashboard.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
            <div>
              <label className="label" htmlFor="assistantName">Assistant Name</label>
              <input id="assistantName" {...register('assistantName')} className="input" defaultValue={cfg.assistantName ?? ''} />
            </div>
            <div>
              <label className="label" htmlFor="languageBehavior">Language Behavior</label>
              <textarea id="languageBehavior" {...register('languageBehavior')} className="input min-h-[80px]" defaultValue={cfg.languageBehavior ?? ''} />
            </div>
            <div>
              <label className="label" htmlFor="firstMessage">First Message</label>
              <textarea id="firstMessage" {...register('firstMessage')} className="input min-h-[80px]" defaultValue={cfg.firstMessage ?? ''} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={update.isPending} className="btn-primary">
                {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
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
