import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn('relative w-full bg-white rounded-xl shadow-pop flex flex-col max-h-[90vh]', sizes[size])}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || description) && (
          <div className="px-6 py-4 border-b border-ink-200 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && <h2 id="modal-title" className="text-base font-semibold text-ink-900">{title}</h2>}
                {description && <p className="text-sm text-ink-500 mt-1">{description}</p>}
              </div>
              <button onClick={onClose} className="text-ink-400 hover:text-ink-600 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-ink-200 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
