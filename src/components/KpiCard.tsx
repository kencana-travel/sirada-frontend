import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { classNames, formatDelta } from '../lib/format';
import { Skeleton } from './Spinner';

interface KpiCardProps {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  deltaPercent?: number;
  deltaLabel?: string;
  /** Badge tambahan di bawah nilai (mis. okupansi rute terlaris). */
  badge?: ReactNode;
  subtitle?: ReactNode;
  loading?: boolean;
}

export default function KpiCard({
  title,
  value,
  icon,
  deltaPercent,
  deltaLabel = 'vs bulan lalu',
  badge,
  subtitle,
  loading,
}: KpiCardProps) {
  const up = (deltaPercent ?? 0) >= 0;

  if (loading) {
    return (
      <div className="rounded-xl border border-hairline bg-white p-5 shadow-card">
        <div className="flex items-start justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <Skeleton className="mt-4 h-8 w-32" />
        <Skeleton className="mt-3 h-4 w-28" />
      </div>
    );
  }

  return (
    <div className="group rounded-xl border border-hairline bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-maroon-50 text-maroon-700">
          {icon}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
        {badge}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {subtitle ? (
          <span className="text-slate-500">{subtitle}</span>
        ) : deltaPercent !== undefined ? (
          <>
            <span
              className={classNames(
                'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold',
                up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
              )}
            >
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {formatDelta(deltaPercent)}
            </span>
            <span className="text-slate-400">{deltaLabel}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
