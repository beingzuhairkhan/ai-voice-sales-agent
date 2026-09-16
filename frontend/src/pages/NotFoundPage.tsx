import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 p-6">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-warning-50 flex items-center justify-center text-warning-600 mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-ink-900">404</h1>
        <p className="text-sm text-ink-500 mt-2">The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
