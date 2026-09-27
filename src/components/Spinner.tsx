import { Loader2 } from 'lucide-react';
import { classNames } from '../lib/format';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={classNames('h-5 w-5 animate-spin text-maroon-600', className)} />;
}

export function CenterSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
      <Spinner className="h-7 w-7" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('skeleton', className)} />;
}
