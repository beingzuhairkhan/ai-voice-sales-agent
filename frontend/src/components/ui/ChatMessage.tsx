import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import type { TranscriptMessage } from '@/types/api';

interface ChatMessageProps {
  message: TranscriptMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const content = message.message ?? message.content ?? message.text ?? '';
  const time = message.timestamp ?? message.createdAt;

  return (
    <div className={cn('flex gap-3', isAssistant ? 'flex-row' : 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isAssistant ? 'bg-brand-100 text-brand-600' : 'bg-success-100 text-success-600',
        )}
      >
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      <div className={cn('flex flex-col max-w-[75%]', isAssistant ? 'items-start' : 'items-end')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-ink-700">
            {isAssistant ? 'Assistant' : 'Customer'}
          </span>
          {message.language && message.language !== 'unknown' && (
            <span className="text-xs text-ink-400 capitalize">{message.language}</span>
          )}
        </div>
        <div
          className={cn(
            'rounded-xl px-4 py-2.5 text-sm',
            isAssistant
              ? 'bg-brand-50 text-ink-800 rounded-tl-sm'
              : 'bg-success-50 text-ink-800 rounded-tr-sm',
          )}
        >
          {content || <span className="text-ink-400 italic">(empty)</span>}
        </div>
        {time && <span className="text-xs text-ink-400 mt-1">{formatDateTime(time)}</span>}
      </div>
    </div>
  );
}
