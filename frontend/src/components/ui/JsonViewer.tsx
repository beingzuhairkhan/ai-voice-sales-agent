import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonViewerProps {
  data: unknown;
  className?: string;
  defaultExpanded?: boolean;
}

export function JsonViewer({ data, className, defaultExpanded = false }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (data == null) {
    return <span className={cn('text-sm text-ink-400', className)}>—</span>;
  }

  const jsonStr = JSON.stringify(data, null, 2);

  return (
    <div className={cn('rounded-lg border border-ink-200 bg-ink-50 overflow-hidden', className)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-1 px-3 py-2 text-xs font-medium text-ink-600 hover:bg-ink-100 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {expanded ? 'Collapse' : 'Expand'} JSON
      </button>
      {expanded && (
        <pre className="p-3 text-xs font-mono text-ink-700 overflow-x-auto max-h-96 overflow-y-auto bg-white">
          {jsonStr}
        </pre>
      )}
    </div>
  );
}
