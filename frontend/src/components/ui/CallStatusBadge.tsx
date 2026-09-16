import { PhoneCall, PhoneIncoming, PhoneMissed, PhoneOff, Phone, Clock, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CallStatus } from '@/types/api';

interface Props {
  status?: CallStatus | null;
  className?: string;
  pulse?: boolean;
}

const config: Record<string, { color: string; icon: typeof Phone; pulse?: boolean }> = {
  initiated: { color: 'bg-brand-50 text-brand-700 border-brand-200', icon: PhoneCall, pulse: true },
  ringing: { color: 'bg-brand-50 text-brand-700 border-brand-200', icon: PhoneIncoming, pulse: true },
  'in-progress': { color: 'bg-success-50 text-success-700 border-success-100', icon: Phone, pulse: true },
  completed: { color: 'bg-success-50 text-success-700 border-success-100', icon: CheckCircle2 },
  failed: { color: 'bg-error-50 text-error-700 border-error-100', icon: XCircle },
  'no-answer': { color: 'bg-ink-100 text-ink-600 border-ink-200', icon: PhoneMissed },
  busy: { color: 'bg-warning-50 text-warning-700 border-warning-100', icon: PhoneOff },
  cancelled: { color: 'bg-ink-100 text-ink-600 border-ink-200', icon: XCircle },
};

export function CallStatusBadge({ status, className, pulse }: Props) {
  if (!status) {
    return <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border bg-ink-100 text-ink-600 border-ink-200', className)}>—</span>;
  }
  const c = config[status] ?? { color: 'bg-ink-100 text-ink-600 border-ink-200', icon: Clock };
  const Icon = c.icon;
  const shouldPulse = pulse ?? c.pulse;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap', c.color, className)}>
      <span className="relative flex">
        {shouldPulse && (
          <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60 animate-pulse-ring', c.color.split(' ')[0])} />
        )}
        <Icon className="w-3 h-3 relative" />
      </span>
      <span className="capitalize">{status.replace(/-/g, ' ')}</span>
    </span>
  );
}
