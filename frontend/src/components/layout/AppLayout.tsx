import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { StartCallModal } from '@/components/StartCallModal';

const titleMap: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/calls': 'Calls',
  '/leads': 'Leads',
  '/callbacks': 'Callbacks',
  '/whatsapp': 'WhatsApp Messages',
  '/activity': 'Activity / Action Events',
  '/webhooks': 'Webhook Events',
  '/agent': 'Agent / Voice Configuration',
  '/files': 'Files / Assets',
  '/settings': 'Settings / Configuration',
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const location = useLocation();

  const title = titleMap[location.pathname] ?? (() => {
    if (location.pathname.startsWith('/calls/')) return 'Call Details';
    if (location.pathname.startsWith('/leads/')) return 'Lead Details';
    return 'ElevateBox';
  })();

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative animate-slide-in-right">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          onStartCall={() => setCallModalOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <StartCallModal open={callModalOpen} onClose={() => setCallModalOpen(false)} />
    </div>
  );
}
