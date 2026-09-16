import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, PhoneCall, User, Activity } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useHealth } from '@/hooks/useQueries';
import { cn } from '@/lib/utils';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
  onStartCall?: () => void;
}

export function Topbar({ title, onMenuClick, onStartCall }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const health = useHealth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isHealthy = health.data?.status === 'ok' || health.data?.status === 'healthy';

  return (
    <header className="h-16 bg-white border-b border-ink-200 flex items-center justify-between gap-4 px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden text-ink-500 hover:text-ink-700"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base font-semibold text-ink-900 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-ink-200"
          title={health.isError ? 'Backend unreachable' : isHealthy ? 'Backend healthy' : 'Backend status unknown'}
        >
          <span className="relative flex">
            <span
              className={cn(
                'absolute inline-flex h-2 w-2 rounded-full opacity-60 animate-ping',
                health.isError ? 'bg-error-500' : isHealthy ? 'bg-success-500' : 'bg-warning-500',
              )}
            />
            <span
              className={cn(
                'relative inline-flex h-2 w-2 rounded-full',
                health.isError ? 'bg-error-500' : isHealthy ? 'bg-success-500' : 'bg-warning-500',
              )}
            />
          </span>
          <span className="text-xs font-medium text-ink-600">
            {health.isError ? 'Offline' : isHealthy ? 'Healthy' : 'Checking…'}
          </span>
        </div>

        {onStartCall && (
          <button onClick={onStartCall} className="btn-primary hidden sm:inline-flex">
            <PhoneCall className="w-4 h-4" />
            Start Call
          </button>
        )}

        <div className="flex items-center gap-2 pl-3 border-l border-ink-200">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-medium text-ink-900 max-w-[120px] truncate">
              {user?.name ?? user?.email ?? 'Admin'}
            </p>
            <p className="text-xs text-ink-500">{user?.role ?? 'Administrator'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-ink-400 hover:text-error-600 transition-colors p-1"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
