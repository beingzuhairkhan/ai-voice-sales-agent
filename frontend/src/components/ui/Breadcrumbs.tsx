import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {item.to && !isLast ? (
                <Link to={item.to} className="text-ink-500 hover:text-ink-700 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-ink-900 font-medium' : 'text-ink-500'}>{item.label}</span>
              )}
              {!isLast && <ChevronRight className="w-3.5 h-3.5 text-ink-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface DetailFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function DetailField({ label, children, className }: DetailFieldProps) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-ink-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-ink-900 mt-0.5">{children}</dd>
    </div>
  );
}

interface DetailGridProps {
  children: ReactNode;
  className?: string;
}

export function DetailGrid({ children, className }: DetailGridProps) {
  return <dl className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className ?? ''}`}>{children}</dl>;
}
