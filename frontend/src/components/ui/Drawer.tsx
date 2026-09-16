import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, description, children, footer, width = 'max-w-md' }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn('relative h-full w-full bg-white shadow-pop flex flex-col', width)}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-ink-200 shrink-0 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold text-ink-900">{title}</h2>}
            {description && <p className="text-sm text-ink-500 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-ink-200 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
