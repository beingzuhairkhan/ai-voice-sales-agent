import { Flame, Thermometer, Snowflake } from 'lucide-react';
import { Badge } from './Badge';
import { cn } from '@/lib/utils';
import type { LeadTemperature } from '@/types/api';

interface Props {
  temperature?: LeadTemperature | null;
  className?: string;
  size?: 'sm' | 'md';
}

export function TemperatureBadge({ temperature, className, size = 'sm' }: Props) {
  if (!temperature || temperature === 'UNKNOWN') {
    return (
      <Badge variant="neutral" className={className}>
        Unknown
      </Badge>
    );
  }

  const config = {
    HOT: {
      variant: 'error' as const,
      icon: Flame,
      label: 'HOT',
      cls: 'bg-hot-50 text-hot-600 border-hot-100',
    },
    WARM: {
      variant: 'warning' as const,
      icon: Thermometer,
      label: 'WARM',
      cls: 'bg-warm-50 text-warm-600 border-warm-100',
    },
    COLD: {
      variant: 'info' as const,
      icon: Snowflake,
      label: 'COLD',
      cls: 'bg-cold-50 text-cold-600 border-cold-100',
    },
  };

  const c = config[temperature as keyof typeof config];
  if (!c) {
    return (
      <Badge variant="neutral" className={className}>
        {temperature}
      </Badge>
    );
  }

  const Icon = c.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap',
        c.cls,
        size === 'md' && 'px-2.5 py-1 text-sm',
        className,
      )}
    >
      <Icon className={size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />
      {c.label}
    </span>
  );
}
