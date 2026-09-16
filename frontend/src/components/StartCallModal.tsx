import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PhoneCall, Loader2, AlertCircle, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useStartCall } from '@/hooks/useQueries';
import { useToast } from '@/providers/ToastContext';
import { extractError } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import type { StartCallResponse } from '@/types/api';

const schema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Enter a valid phone number (at least 10 digits)')
    .regex(/^\+?[\d\s-]+$/, 'Phone number may only contain digits, spaces, and a leading +'),
  language: z.enum(['telugu', 'hindi', 'english']).optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_PHONE = '+919967705134';

interface StartCallModalProps {
  open: boolean;
  onClose: () => void;
}

export function StartCallModal({ open, onClose }: StartCallModalProps) {
  const [result, setResult] = useState<StartCallResponse | null>(null);
  const startCall = useStartCall();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: DEFAULT_PHONE },
  });

  const handleClose = () => {
    reset({ phoneNumber: DEFAULT_PHONE });
    setResult(null);
    startCall.reset();
    onClose();
  };

  const onSubmit = (values: FormValues) => {
    setResult(null);
    startCall.mutate(
      { phoneNumber: values.phoneNumber},
      {
        onSuccess: (data) => {
          setResult(data);
          toast.success('Outbound call initiated', 'The backend is placing the call through Vapi.');
        },
        onError: (err) => {
          toast.error('Failed to start call', extractError(err));
        },
      },
    );
  };

  const callId = result?.callId ?? result?._id ?? result?.id ?? result?.call?._id ?? result?.call?.id;
  const vapiCallId = result?.vapiCallId ?? result?.call?.vapiCallId;
  const status = result?.status ?? result?.call?.status;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Start Outbound Call"
      description="The backend will place a real outbound phone call through Vapi."
      size="md"
    >
      {!result ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
            <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <p className="text-sm text-brand-800">
              This triggers a live voice call. The NestJS backend instructs Vapi to dial the number, and the
              AI agent speaks in Telugu, Hindi, or English. You will see real-time status here once the backend
              reports it.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              {...register('phoneNumber')}
              className="input"
              placeholder="+91XXXXXXXXXX"
              defaultValue={DEFAULT_PHONE}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-error-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phoneNumber.message}
              </p>
            )}
            <p className="text-xs text-ink-400 mt-1">
              Defaults to the assignment number {DEFAULT_PHONE}.
            </p>
          </div>

         

          {startCall.isError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 border border-error-100">
              <AlertCircle className="w-4 h-4 text-error-600 shrink-0 mt-0.5" />
              <p className="text-sm text-error-700">{extractError(startCall.error)}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={startCall.isPending} className="btn-primary">
              {startCall.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PhoneCall className="w-4 h-4" />
              )}
              {startCall.isPending ? 'Placing call…' : 'Start Call'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success-50 border border-success-100">
            <CheckCircle2 className="w-6 h-6 text-success-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success-800">Call initiated</p>
              <p className="text-xs text-success-700 mt-0.5">
                The backend has accepted the request and is placing the call through Vapi.
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 p-4 rounded-lg border border-ink-200 bg-ink-50">
            <div>
              <dt className="text-xs font-medium text-ink-500 uppercase tracking-wide">Internal Call ID</dt>
              <dd className="text-sm font-mono text-ink-900 mt-0.5 break-all">{callId ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-500 uppercase tracking-wide">Vapi Call ID</dt>
              <dd className="text-sm font-mono text-ink-900 mt-0.5 break-all">{vapiCallId ?? 'Pending'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-500 uppercase tracking-wide">Status</dt>
              <dd className="text-sm text-ink-900 mt-0.5 capitalize">{status ?? 'initiated'}</dd>
            </div>
          </dl>

          <div className="flex justify-end gap-2">
            <button onClick={handleClose} className="btn-secondary">
              Close
            </button>
            <button
              onClick={() => {
                if (callId) {
                  handleClose();
                  navigate(`/calls/${callId}`);
                }
              }}
              disabled={!callId}
              className="btn-primary"
            >
              View Call Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
