import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  trend?: string;
  accent?: 'brand' | 'hot' | 'warm' | 'cold' | 'success' | 'error' | 'warning' | 'neutral';
  className?: string;
}

const accents: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'bg-brand-50 text-brand-600',
  hot: 'bg-hot-50 text-hot-600',
  warm: 'bg-warm-50 text-warm-600',
  cold: 'bg-cold-50 text-cold-600',
  success: 'bg-success-50 text-success-600',
  error: 'bg-error-50 text-error-600',
  warning: 'bg-warning-50 text-warning-600',
  neutral: 'bg-ink-100 text-ink-600',
};

export function StatCard({ label, value, icon, hint, trend, accent = 'neutral', className }: StatCardProps) {
  return (
    <div className={cn('card p-5 flex items-start gap-4 transition-shadow hover:shadow-card-hover', className)}>
      {icon && (
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', accents[accent])}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-ink-900 mt-1 tabular-nums">{value}</p>
        {hint && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
        {trend && <p className="text-xs text-ink-500 mt-1">{trend}</p>}
      </div>
    </div>
  );
}
