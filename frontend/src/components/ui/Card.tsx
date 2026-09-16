import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function ChartCard({ title, description, children, className, action, isEmpty, emptyMessage }: ChartCardProps) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          {description && <p className="text-xs text-ink-500 mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {isEmpty ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-ink-400">
          {emptyMessage ?? 'No data available'}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-xl font-bold text-ink-900">{title}</h1>
        {description && <p className="text-sm text-ink-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
