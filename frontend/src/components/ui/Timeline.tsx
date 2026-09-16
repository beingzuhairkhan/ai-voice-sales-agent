import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  timestamp?: string;
  badge?: ReactNode;
  content?: ReactNode;
  color?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-400 py-4">No events recorded.</p>;
  }
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-ink-200" />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="relative flex gap-4">
            <div
              className={cn(
                'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white',
                item.color ?? 'bg-brand-50 text-brand-600',
              )}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                {item.badge}
              </div>
              {item.subtitle && <p className="text-sm text-ink-500 mt-0.5">{item.subtitle}</p>}
              {item.content && <div className="mt-2">{item.content}</div>}
              {item.timestamp && <p className="text-xs text-ink-400 mt-1">{item.timestamp}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
