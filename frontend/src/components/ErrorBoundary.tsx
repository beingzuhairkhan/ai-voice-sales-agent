import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
          <div className="card p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center text-error-600 mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-ink-900">Something went wrong</h1>
            <p className="text-sm text-ink-500 mt-2">
              An unexpected error occurred while rendering this page. Try refreshing.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-ink-400 mt-3 font-mono break-all">{this.state.error.message}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-6 inline-flex"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
