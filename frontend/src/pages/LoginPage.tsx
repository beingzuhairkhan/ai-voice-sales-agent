import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Zap, Phone, Bot, MessageSquare } from 'lucide-react';
import { useAuth } from '@/providers/AuthContext';
import { useToast } from '@/providers/ToastContext';
import { authService } from '@/api/services/authService';
import { extractError } from '@/api/client';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    authService
      .login(values)
      .then((res) => {
        const token = res.accessToken ?? res.token ?? '';
        if (!token) {
          setServerError('Login succeeded but no access token was returned by the backend.');
          setSubmitting(false);
          return;
        }
        login(token, res.user ?? null);
        toast.success('Welcome back', 'You are now signed in to ElevateBox.');
        navigate('/', { replace: true });
      })
      .catch((err) => {
        const msg = extractError(err);
        setServerError(msg);
        setSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:flex-1 bg-brand-950 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center">
            <Zap className="w-6 h-6" fill="currentColor" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">ElevateBox</p>
            <p className="text-sm text-brand-300 leading-tight">AI Voice Sales Agent</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Automate outbound sales calls with a natural AI voice agent.
          </h2>
          <p className="text-brand-200 text-lg leading-relaxed">
            Monitor live calls, track HOT/WARM/COLD leads, and watch the system send WhatsApp follow-ups
            and book callbacks in real time.
          </p>
          <div className="space-y-3 pt-4">
            {[
              { icon: Phone, label: 'AI outbound calls via Vapi in Telugu, Hindi & English' },
              { icon: Bot, label: 'Automatic lead qualification — HOT, WARM, or COLD' },
              { icon: MessageSquare, label: 'Mid-call WhatsApp + post-call personalized follow-up' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3 text-brand-100">
                  <div className="w-8 h-8 rounded-lg bg-brand-800/60 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-xs text-brand-400">
          Admin control & monitoring dashboard. All voice, AI, and messaging operations run on the NestJS backend.
        </p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-ink-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Zap className="w-5 h-5" fill="currentColor" />
            </div>
            <div>
              <p className="text-base font-bold text-ink-900 leading-tight">ElevateBox</p>
              <p className="text-xs text-ink-500 leading-tight">AI Voice Sales Agent</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink-900">Sign in</h1>
            <p className="text-sm text-ink-500 mt-1">Enter your credentials to access the admin dashboard.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="input"
                placeholder="admin@elevatebox.ai"
              />
              {errors.email && (
                <p className="text-xs text-error-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 border border-error-100">
                <AlertCircle className="w-4 h-4 text-error-600 shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{serverError}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-ink-400 mt-6 text-center">
            Authentication is handled by the NestJS backend at <code className="font-mono">POST /api/v1/auth/login</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
