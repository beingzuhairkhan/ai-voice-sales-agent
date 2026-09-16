import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Phone,
  Users,
  Clock,
  MessageSquare,
  Activity,
  Webhook,
  Bot,
  FolderOpen,
  Settings,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/calls', label: 'Calls', icon: Phone },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/callbacks', label: 'Callbacks', icon: Clock },
  { to: '/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/webhooks', label: 'Webhooks', icon: Webhook },
  { to: '/agent', label: 'Agent', icon: Bot },
  { to: '/files', label: 'Files', icon: FolderOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-ink-200 w-64 shrink-0">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-ink-200 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0">
          <Zap className="w-5 h-5" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink-900 leading-tight">ElevateBox</p>
          <p className="text-xs text-ink-500 leading-tight">AI Voice Sales Agent</p>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} className="lg:hidden text-ink-400 hover:text-ink-600" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-ink-200 shrink-0">
        <p className="text-xs text-ink-400">
          v1.0.0 · Admin Control
        </p>
      </div>
    </div>
  );
}
