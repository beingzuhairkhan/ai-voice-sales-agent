import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/providers/AuthContext';
import { ToastProvider } from '@/providers/ToastContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Skeleton } from '@/components/ui/States';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CallsPage = lazy(() => import('@/pages/CallsPage').then((m) => ({ default: m.CallsPage })));
const CallDetailsPage = lazy(() => import('@/pages/CallDetailsPage').then((m) => ({ default: m.CallDetailsPage })));
const LeadsPage = lazy(() => import('@/pages/LeadsPage').then((m) => ({ default: m.LeadsPage })));
const LeadDetailsPage = lazy(() => import('@/pages/LeadDetailsPage').then((m) => ({ default: m.LeadDetailsPage })));
const CallbacksPage = lazy(() => import('@/pages/CallbacksPage').then((m) => ({ default: m.CallbacksPage })));
const WhatsAppPage = lazy(() => import('@/pages/WhatsAppPage').then((m) => ({ default: m.WhatsAppPage })));
const ActionEventsPage = lazy(() => import('@/pages/ActionEventsPage').then((m) => ({ default: m.ActionEventsPage })));
const WebhookEventsPage = lazy(() => import('@/pages/WebhookEventsPage').then((m) => ({ default: m.WebhookEventsPage })));
const AgentConfigPage = lazy(() => import('@/pages/AgentConfigPage').then((m) => ({ default: m.AgentConfigPage })));
const FilesPage = lazy(() => import('@/pages/FilesPage').then((m) => ({ default: m.FilesPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
                  <Route path="/calls" element={<Suspense fallback={<PageLoader />}><CallsPage /></Suspense>} />
                  <Route path="/calls/:id" element={<Suspense fallback={<PageLoader />}><CallDetailsPage /></Suspense>} />
                  <Route path="/leads" element={<Suspense fallback={<PageLoader />}><LeadsPage /></Suspense>} />
                  <Route path="/leads/:id" element={<Suspense fallback={<PageLoader />}><LeadDetailsPage /></Suspense>} />
                  <Route path="/callbacks" element={<Suspense fallback={<PageLoader />}><CallbacksPage /></Suspense>} />
                  <Route path="/whatsapp" element={<Suspense fallback={<PageLoader />}><WhatsAppPage /></Suspense>} />
                  <Route path="/activity" element={<Suspense fallback={<PageLoader />}><ActionEventsPage /></Suspense>} />
                  <Route path="/webhooks" element={<Suspense fallback={<PageLoader />}><WebhookEventsPage /></Suspense>} />
                  <Route path="/agent" element={<Suspense fallback={<PageLoader />}><AgentConfigPage /></Suspense>} />
                  <Route path="/files" element={<Suspense fallback={<PageLoader />}><FilesPage /></Suspense>} />
                  <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
                </Route>
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
