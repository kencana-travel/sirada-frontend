import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function ErrorState({
  message = 'Gagal memuat data.',
  onRetry,
  compact,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-center ${
        compact ? 'py-8' : 'py-14'
      }`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-700">Terjadi kendala</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
